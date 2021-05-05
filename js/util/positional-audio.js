"use strict"

import { UrlTexture } from '../render/core/texture.js';
import { ButtonNode } from '../render/nodes/button.js';
import { Gltf2Node } from '../render/nodes/gltf2.js';
import { mat4, vec3 } from '../render/math/gl-matrix.js';
import { initObject, updateObject } from './object-sync.js';

const ANALYSER_FFT_SIZE = 1024;
const DEFAULT_HEIGHT = 1.5;

let playButton = null;
let playTexture = new UrlTexture('./media/textures/play-button.png');
let pauseTexture = new UrlTexture('./media/textures/pause-button.png');
// const AudioContext = window.AudioContext || window.webkitAudioContext;

// Audio scene globals
let audioContext = new AudioContext();
export let resonance = new ResonanceAudio(audioContext);
resonance.output.connect(audioContext.destination);

export let stereo = new Gltf2Node({ url: './media/gltf/stereo/stereo.gltf' });
// FIXME: Temporary fix to initialize for cloning.
stereo.visible = false;

audioContext.suspend();

// TODO: This is crashing in recent versions of Resonance for me, and I'm
// not sure why. It does run succesfully without it, though.
// Rough roomID dimensions in meters (estimated from model in Blender.)
/*let roomDimensions = {
  width : 6,
  height : 3,
  depth : 6
};

// Simplified view of the materials that make up the scene.
let roomMaterials = {
  left : 'plywood-panel', // Garage walls
  right : 'plywood-panel',
  front : 'plywood-panel',
  back : 'metal', // To account for the garage door
  down : 'polished-concrete-or-tile', // garage floor
  up : 'wood-ceiling'
};
resonance.setRoomProperties(roomDimensions, roomMaterials);*/

export function createAudioSource(options) {
    // Create a Resonance source and set its position in space.
    let source = resonance.createSource();
    let pos = options.position;
    source.setPosition(pos[0], pos[1], pos[2]);

    // Connect an analyser. This is only for visualization of the audio, and
    // in most cases you won't want it.
    let analyser = audioContext.createAnalyser();
    analyser.fftSize = ANALYSER_FFT_SIZE;
    analyser.lastRMSdB = 0;

    return fetch(options.url)
        .then((response) => response.arrayBuffer())
        .then((buffer) => audioContext.decodeAudioData(buffer))
        .then((decodedBuffer) => {
            let bufferSource = createBufferSource(
                source, decodedBuffer, analyser);

            return {
                buffer: decodedBuffer,
                bufferSource: bufferSource,
                source: source,
                analyser: analyser,
                position: pos,
                rotateY: options.rotateY,
                node: null
            };
        });
}

function createBufferSource(source, buffer, analyser) {
    // Create a buffer source. This will need to be recreated every time
    // we wish to start the audio, see
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
    let bufferSource = audioContext.createBufferSource();
    bufferSource.loop = true;
    bufferSource.connect(source.input);

    bufferSource.connect(analyser);

    bufferSource.buffer = buffer;

    return bufferSource;
}

/**
 * Returns a floating point value that represents the loudness of the audio
 * stream, appropriate for scaling an object with.
 * @return {Number} loudness scalar.
 */
let fftBuffer = new Float32Array(ANALYSER_FFT_SIZE);
function getLoudnessScale(analyser) {
    analyser.getFloatTimeDomainData(fftBuffer);
    let sum = 0;
    for (let i = 0; i < fftBuffer.length; ++i)
        sum += fftBuffer[i] * fftBuffer[i];

    // Calculate RMS and convert it to DB for perceptual loudness.
    let rms = Math.sqrt(sum / fftBuffer.length);
    let db = 30 + 10 / Math.LN10 * Math.log(rms <= 0 ? 0.0001 : rms);

    // Moving average with the alpha of 0.525. Experimentally determined.
    analyser.lastRMSdB += 0.525 * ((db < 0 ? 0 : db) - analyser.lastRMSdB);

    // Scaling by 1/30 is also experimentally determined. Max is to present
    // objects from disappearing entirely.
    return Math.max(0.3, analyser.lastRMSdB / 30.0);
}

export let audioSources = [];

export function updateAudioNodes(scene) {
    if (!stereo)
        return;

    for (let source of audioSources) {
        if (!source.node) {
            // initObject first, if websocket is not ready, return directly
            // if (window.wsclient.ws.readyState != WebSocket.OPEN) {
            //     console.log("websocket not ready");
            //     return;
            // }
            source.node = stereo.clone();
            source.node.visible = true;
            source.node.selectable = true;
            scene.addNode(source.node);
            // ZH
            let mymatrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            mat4.identity(mymatrix);
            // console.log("mymatrix", mymatrix);
            let mypos = source.position;
            mypos[1] -= 0.5;
            mat4.translate(mymatrix, mymatrix, mypos);
            // console.log("mymatrix", mymatrix);
            mat4.rotateY(mymatrix, mymatrix, source.rotateY);
            let scale = getLoudnessScale(source.analyser);
            mat4.scale(mymatrix, mymatrix, [scale, scale, scale]);
            initObject("stereo", mymatrix, window.envObjID++); // 0 means for environment
            console.log("init object", window.envObjID);
        }

        let node = source.node;
        let matrix = node.matrix;

        // Move the node to the right location.
        mat4.identity(matrix);
        mat4.translate(matrix, matrix, source.position);
        mat4.rotateY(matrix, matrix, source.rotateY);

        // Scale it based on loudness of the audio channel
        let scale = getLoudnessScale(source.analyser);
        mat4.scale(matrix, matrix, [scale, scale, scale]);
    }
}

function playAudio() {
    if (audioContext.state == 'running')
        return;

    audioContext.resume();

    for (let source of audioSources) {
        source.bufferSource.start(0);
    }

    if (playButton) {
        playButton.iconTexture = pauseTexture;
    }
}

export function pauseAudio() {
    if (audioContext.state == 'suspended')
        return;

    for (let source of audioSources) {
        source.bufferSource.stop(0);
        source.bufferSource = createBufferSource(
            source.source, source.buffer, source.analyser);
    }

    audioContext.suspend();

    if (playButton) {
        playButton.iconTexture = playTexture;
    }
}

window.addEventListener('blur', () => {
    // As a general rule you should mute any sounds your page is playing
    // whenever the page loses focus.
    pauseAudio();
});

export function updateAudioSources(frame, refSpace) {
    let tmpMatrix = mat4.create();
    // for (let source of audioSources) {
    //     if (source.draggingInput) {
    //         let draggingPose = frame.getPose(source.draggingInput.targetRaySpace, refSpace);
    //         if (draggingPose) {
    //             let pos = source.position;
    //             mat4.multiply(tmpMatrix, draggingPose.transform.matrix, source.draggingTransform);
    //             vec3.transformMat4(pos, [0, 0, 0], tmpMatrix);
    //             source.source.setPosition(pos[0], pos[1], pos[2]);
    //         }
    //     }
    // }
    for (let id in window.objects) {
        if (window.objects[id].draggingInput) {
            let draggingPose = frame.getPose(window.objects[id].draggingInput.targetRaySpace, refSpace);
            if (draggingPose) {
                // let pos = window.objects[id].matrix.position;
                mat4.multiply(window.objects[id].matrix, draggingPose.transform.matrix, window.objects[id].draggingTransform);
                updateObject(id, window.objects[id].matrix);
                window.objects[id].node.matrix = tmpMatrix;
            }
        }
    }
}

export function loadAudioSources(scene) {
    Promise.all([
        createAudioSource({
            url: 'media/sound/guitar.ogg',
            position: [0, DEFAULT_HEIGHT, -1],
            rotateY: 0
        }),
        createAudioSource({
            url: 'media/sound/drums.ogg',
            position: [-1, DEFAULT_HEIGHT, 0],
            rotateY: Math.PI * 0.5
        }),
        createAudioSource({
            url: 'media/sound/perc.ogg',
            position: [1, DEFAULT_HEIGHT, 0],
            rotateY: Math.PI * -0.5
        }),
    ]).then((sources) => {
        audioSources = sources;

        // Once the audio is loaded, create a button that toggles the
        // audio state when clicked.
        playButton = new ButtonNode(playTexture, () => {
            if (audioContext.state == 'running') {
                pauseAudio();
            } else {
                playAudio();
            }
        });
        playButton.translation = [0, 1., 0.25];
        scene.addNode(playButton);
    });
}
