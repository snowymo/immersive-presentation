import { WebXRButton } from "./util/webxr-button.js";
import { Scene } from "./render/core/scene.js";
import { Renderer, createWebGLContext, initRenderListGl } from "./render/core/renderer.js";
import { Gltf2Node } from "./render/nodes/gltf2.js";
import { mat4, vec3 } from "./render/math/gl-matrix.js";
import { Ray } from "./render/math/ray.js";
import { InlineViewerHelper } from "./util/inline-viewer-helper.js";
import { QueryArgs } from "./util/query-args.js";
import { EventBus } from "./primitive/eventbus.js";
import * as DefaultSystemEvents from "./primitive/event.js";
import {
    loadAudioSources,
    updateAudioSources,
    updateAudioNodes,
    stereo,
    resonance,
    audioSources,
    pauseAudio,
} from "./util/positional-audio.js";
import { Client as WSClient } from "./util/websocket-client.js";
import { updateController } from "./render/core/renderListScene.js";
import * as keyboardInput from "./util/input_keyboard.js";
import { InputController } from "./util/input_controller.js";

import { corelink_message } from "./util/corelink_sender.js"
import { metaroomSender } from "./corelink_handler.js"

window.wsport = 8447;

// If requested, use the polyfill to provide support for mobile devices
// and devices which only support WebVR.
import WebXRPolyfill from "./third-party/webxr-polyfill/build/webxr-polyfill.module.js";
import { updateObject } from "./util/object-sync.js";
if (QueryArgs.getBool("usePolyfill", true)) {
    let polyfill = new WebXRPolyfill();
}

// XR globals.
let xrButton = null;
let xrImmersiveRefSpace = null;
let inlineViewerHelper = null;
let inputController = null;
let time = 0;

// WebGL scene globals.
let gl = null;
let renderer = null;
window.scene = new Scene();

function initModels() {
    window.models = {};
    window.models["stereo"] = new Gltf2Node({
        url: "./media/gltf/stereo/stereo.gltf",
    });
    window.models["stereo"].visible = true;
    // window.scene.addNode(window.models['stereo']);
}

window.scene.standingStats(true);
// window.scene.addNode(window.models['stereo']);

export function initXR() {
    xrButton = new WebXRButton({
        onRequestSession: onRequestSession,
        onEndSession: onEndSession,
    });
    document.querySelector("header").appendChild(xrButton.domElement);

    if (navigator.xr) {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
            xrButton.enabled = supported;
        });

        // Load multiple audio sources.
        loadAudioSources(window.scene);

        navigator.xr.requestSession("inline").then(onSessionStarted);
    }

    // custom init
    window.EventBus = new EventBus();
    // window.objs = [];
    DefaultSystemEvents.init();
    // websocket
    // window.wsclient = new WSClient();
    // if (window.location.port) {
    //     window.wsclient.connect(window.location.hostname, window.location.port);
    // } else {
    //     window.wsclient.connect("eye.3dvar.com", window.wsport);
    // }
    initModels();
    keyboardInput.initKeyEvents();
}

window.testws = function () {
    window.wsclient.send("test");
};

function initGL() {
    if (gl) return;

    gl = createWebGLContext({
        xrCompatible: true,
        webgl2: true,
    });
    document.body.appendChild(gl.canvas);

    function onResize() {
        gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
        gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
    }
    window.addEventListener("resize", onResize);
    onResize();

    renderer = new Renderer(gl);
    window.scene.setRenderer(renderer);

    // Loads a generic controller meshes.
    window.scene.inputRenderer.setControllerMesh(
        new Gltf2Node({ url: "media/gltf/controller/controller.gltf" }),
        "right"
    );
    window.scene.inputRenderer.setControllerMesh(
        new Gltf2Node({ url: "media/gltf/controller/controller-left.gltf" }),
        "left"
    );
}

function onRequestSession() {
    return navigator.xr
        .requestSession("immersive-vr", {
            requiredFeatures: ["local-floor"],
        })
        .then((session) => {
            xrButton.setSession(session);
            session.isImmersive = true;
            onSessionStarted(session);
        });
}

async function onSessionStarted(session) {
    session.addEventListener("end", onSessionEnded);

    session.addEventListener("selectstart", onSelectStart);
    session.addEventListener("selectend", onSelectEnd);
    session.addEventListener("select", (ev) => {
        let refSpace = ev.frame.session.isImmersive
            ? inputController.referenceSpace
            : inlineViewerHelper.referenceSpace;
        window.scene.handleSelect(ev.inputSource, ev.frame, refSpace);
    });

    initGL();
    await initRenderListGl(gl);
    // scene.inputRenderer.useProfileControllerMeshes(session);

    let glLayer = new XRWebGLLayer(session, gl);
    session.updateRenderState({ baseLayer: glLayer });

    let refSpaceType = session.isImmersive ? "local-floor" : "viewer";
    session.requestReferenceSpace(refSpaceType).then((refSpace) => {
        if (session.isImmersive) {
            // xrImmersiveRefSpace = refSpace;
            inputController = new InputController(refSpace);
            xrImmersiveRefSpace = inputController.referenceSpace;
        } else {
            inlineViewerHelper = new InlineViewerHelper(gl.canvas, refSpace);
            inlineViewerHelper.setHeight(1.6);
        }

        session.requestAnimationFrame(onXRFrame);
    });
}

function onEndSession(session) {
    session.end();
}

function onSessionEnded(event) {
    if (event.session.isImmersive) {
        xrButton.setSession(null);

        // Stop the audio playback when we exit XR.
        pauseAudio();
    }
}

function updateInputSources(session, frame, refSpace) {
    for (let inputSource of session.inputSources) {
        let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);

        // We may not get a pose back in cases where the input source has lost
        // tracking or does not know where it is relative to the given frame
        // of reference.
        if (!targetRayPose) {
            continue;
        }

        // If we have a pointer matrix we can also use it to render a cursor
        // for both handheld and gaze-based input sources.

        // Statically render the cursor 2 meters down the ray since we're
        // not calculating any intersections in this sample.
        let targetRay = new Ray(targetRayPose.transform);
        let cursorDistance = 2.0;
        let cursorPos = vec3.fromValues(
            targetRay.origin.x,
            targetRay.origin.y,
            targetRay.origin.z
        );
        vec3.add(cursorPos, cursorPos, [
            targetRay.direction.x * cursorDistance,
            targetRay.direction.y * cursorDistance,
            targetRay.direction.z * cursorDistance,
        ]);
        // vec3.transformMat4(cursorPos, cursorPos, inputPose.targetRay.transformMatrix);

        window.scene.inputRenderer.addCursor(cursorPos);

        if (inputSource.gripSpace) {
            let gripPose = frame.getPose(inputSource.gripSpace, refSpace);
            if (gripPose) {
                // If we have a grip pose use it to render a mesh showing the
                // position of the controller.
                window.scene.inputRenderer.addController(
                    gripPose.transform.matrix,
                    inputSource.handedness
                ); // let controller = this._controllers[handedness]; // so it is updating actually
                // ZH: update location
                if (window.playerid) {
                    if (inputSource.handedness == "left") {
                        window.avatars[window.playerid].leftController.position =
                            gripPose.transform.position;
                        window.avatars[window.playerid].leftController.orientation =
                            gripPose.transform.orientation;
                        window.avatars[window.playerid].leftController.matrix =
                            gripPose.transform.matrix;
                    } else if (inputSource.handedness == "right") {
                        window.avatars[window.playerid].rightController.position =
                            gripPose.transform.position;
                        window.avatars[window.playerid].rightController.orientation =
                            gripPose.transform.orientation;
                        window.avatars[window.playerid].rightController.matrix =
                            gripPose.transform.matrix;
                    }
                }
            }
        }
        let headPose = frame.getViewerPose(refSpace);
        if (window.playerid) {
            window.avatars[window.playerid].headset.position =
                headPose.transform.position;
            window.avatars[window.playerid].headset.orientation =
                headPose.transform.orientation;
            window.avatars[window.playerid].headset.matrix =
                headPose.transform.matrix;
        }
    }
}

function hitTest(inputSource, frame, refSpace) {
    let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);
    if (!targetRayPose) {
        return;
    }

    let hitResult = window.scene.hitTest(targetRayPose.transform);
    if (hitResult) {
        // for (let source of audioSources) {
        //     if (hitResult.node === source.node) {
        //         // Associate the input source with the audio source object until
        //         // onSelectEnd event is raised with the same input source.
        //         source.draggingInput = inputSource;
        //         source.draggingTransform = mat4.create();
        //         mat4.invert(source.draggingTransform, targetRayPose.transform.matrix);
        //         mat4.multiply(source.draggingTransform, source.draggingTransform, source.node.matrix);
        //         return true;
        //     }
        // }
        for (let id in window.objects) {
            if (hitResult.node === window.objects[id].node) {
                // Associate the input source with the audio source object until
                // onSelectEnd event is raised with the same input source.
                window.objects[id].draggingInput = inputSource;
                window.objects[id].draggingTransform = mat4.create();
                mat4.invert(
                    window.objects[id].draggingTransform,
                    targetRayPose.transform.matrix
                );
                mat4.multiply(
                    window.objects[id].draggingTransform,
                    window.objects[id].draggingTransform,
                    window.objects[id].node.matrix
                );
                updateObject(id, window.objects[id].node.matrix);
                return true;
            }
        }
    }

    return false;
}

window.testObjSync = function (id) {
    mat4.translate(
        window.objects[id].node.matrix,
        window.objects[id].node.matrix,
        [0.2, 0.1, 0]
    );
    updateObject(id, window.objects[id].node.matrix);
};

function onSelectStart(ev) {
    let refSpace = ev.frame.session.isImmersive
        ? inputController.referenceSpace
        : inlineViewerHelper.referenceSpace;
    hitTest(ev.inputSource, ev.frame, refSpace);
}

// Remove any references to the input source from the audio sources so
// that the objects are not dragged any further after the user releases
// the trigger.
function onSelectEnd(ev) {
    // for (let source of audioSources) {
    //     if (source.draggingInput === ev.inputSource) {
    //         source.draggingInput = undefined;
    //         source.draggingTransform = undefined;
    //     }
    // }
    for (let id in window.objects) {
        if (window.objects[id].draggingInput === ev.inputSource) {
            // Associate the input source with the audio source object until
            // onSelectEnd event is raised with the same input source.
            window.objects[id].draggingInput = undefined;
            window.objects[id].draggingTransform = undefined;
        }
    }
}

function onXRFrame(t, frame) {
    time = t / 1000;
    let session = frame.session;
    let refSpace = session.isImmersive
        ? inputController.referenceSpace
        : inlineViewerHelper.referenceSpace;
    let pose = frame.getViewerPose(refSpace);
    window.scene.startFrame();

    session.requestAnimationFrame(onXRFrame);

    updateInputSources(session, frame, refSpace);
    // ZH: send to websocket server for self avatar sync
    // if (window.playerid != null) window.wsclient.send("avatar", window.playerid);
    // corelink
    if (window.playerid != null) {
        var msg = corelink_message("avatar", window.playerid);
        corelink.send(metaroomSender, msg);
        // console.log("corelink.send", msg);
        // window.wsclient.send("avatar", window.playerid);
    }

    // Update the position of all currently selected audio sources. It's
    // possible to select multiple audio sources and drag them at the same
    // time (one per controller that has the trigger held down).
    updateAudioSources(frame, refSpace);

    updateAudioNodes(window.scene);

    updateAvatars();

    updateObjects();

    if (window.playerid) {
        const thisAvatar = window.avatars[window.playerid];
        for (let source of session.inputSources) {
            if (source.handedness && source.gamepad) {
                updateController(thisAvatar, {
                    handedness: source.handedness,
                    buttons: source.gamepad.buttons,
                });
            }
        }
    }

    window.scene.drawXRFrame(frame, pose, time);

    if (pose) {
        resonance.setListenerFromMatrix({ elements: pose.transform.matrix });
    }

    window.scene.endFrame();
}

function updateAvatars() {
    // update transformation of each avatar audio source
    for (let peerUuid in window.peerConnections) {
        window.updateAvatarAudio(peerUuid);
    }

    // update avatar's model's matrix
    for (let id in window.avatars) {
        if (id == window.playerid) continue;
        let avatar = window.avatars[id];
        if (
            avatar.headset.position.x ||
            avatar.headset.position.y ||
            avatar.headset.position.z
        ) {
            // not in the default pos
            avatar.headset.model.matrix = avatar.headset.matrix;
            avatar.leftController.model.matrix = avatar.leftController.matrix;
            avatar.rightController.model.matrix = avatar.rightController.matrix;
        }
    }
}

function updateObjects() {
    // update objects' attributes
    for (let id in window.objects) {
        let type = window.objects[id]["type"];
        let matrix = window.objects[id]["matrix"];
        // create the model if model is null
        if (!window.objects[id].node) {
            // create the model, this is the sample by gltf model
            // we may need other model style like CG.js later
            window.objects[id].node = new Gltf2Node({
                url: window.models[type]._url,
            });
            window.objects[id].node.visible = true;
            window.objects[id].node.selectable = true;
            window.scene.addNode(window.objects[id].node);
        }
        window.objects[id].node.matrix = matrix;
    }
}

// Start the XR application.
// initXR();
