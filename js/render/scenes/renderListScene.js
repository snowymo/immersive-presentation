"use strict";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList, mList, mBeginBuild, mEndBuild } from "../core/renderList.js";
import { rokokoData } from "../../data/RokokoData.js";

import { demoKen } from "./demoKen.js";
import { demoMocap } from "./demoMocap.js";
import { demoObjects } from "./demoObjects.js";
import { demoParticles } from "./demoParticles.js";

export let viewMatrix = [];

const FEET_TO_METERS = 0.3048;
// set to true to enable some testing animations and functionality
const DEBUG_MODE = false;

let controllerMatrix = { left: [], right: [] };
let buttonState = { left: [], right: [] };
for (let i = 0; i < 7; i++) buttonState.left[i] = buttonState.right[i] = false;

const validHandedness = ["left", "right"];

let flatten = 0,
  zScale = 1;
let cursorPath = [];
let tMode = DEBUG_MODE ? 2 : 0;
let tModeMax = 2;

export let updateController = (avatar, buttonInfo) => {
  controllerMatrix.left = avatar.leftController.matrix;
  controllerMatrix.right = avatar.rightController.matrix;

  if (validHandedness.includes(buttonInfo.handedness)) {
    const h = buttonInfo.handedness;
    const b = buttonInfo.buttons;

    for (let i = 0; i < 7; i++) {
      if (b[i].pressed && !buttonState[h][i]) onPress(h, i);
      else if (b[i].pressed && buttonState[h][i]) onDrag(h, i);
      else if (!b[i].pressed && buttonState[h][i]) onRelease(h, i);

      // Update
      buttonState[h][i] = b[i].pressed;
    }
  }
};

let onPress = (hand, button) => {
  console.log("pressed", hand, "button", button);

  if (hand == "left" && button == 0) {
    zScale = 1;
    cursorPath.push([]);
  }
};

let onDrag = (hand, button) => {
  if (hand == "left" && button == 0)
    if (controllerMatrix[hand]) {
      let P = controllerMatrix[hand].slice(12, 15);
      cursorPath[cursorPath.length - 1].push(P);
    }
};

let onRelease = (hand, button) => {
  console.log("released", hand, "button", button);

  if (hand == "left" && button == 1) {
    tMode = (tMode + 1) % 3;
    switch (tMode) {
      case 1:
        flatten = 50;
        break;
      case 2:
        cursorPath = [];
        terrainMesh = createTerrainMesh();
        break;
    }
  }

  if (hand == "right" && button == 0) nMode = (nMode + 1) % 5;
};

function convertToStaticMesh(renderList) {
  const itemInfo = renderList.getItems();
  const items    = itemInfo.list;
  const count    = itemInfo.count;

  for (let i = 0; i < count; i += 1) {
    if (items[i].mesh) {
      continue;
    }

    const mesh = new Mesh(gl, defaultVertexAttributeDescriptor, false);

    mesh.bind();
    mesh.upload(gl.ARRAY_BUFFER, new Float32Array(items[i].shape), gl.STATIC_DRAW);
    
    items[i].mesh = mesh;
  }
}
let staticObjRenderable = null;
let noiseRenderableLookup = null;

function initModels() {  
  staticObjRenderable = buildStaticObj();
  convertToStaticMesh(staticObjRenderable);

  noiseRenderableLookup = buildNoise(nModeMax + 1);
  for (let i = 0; i < noiseRenderableLookup.length; i += 1) {
    convertToStaticMesh(w.noiseRenderableLookup[i]);
  }
}

let multiline = (path, rgb, width) => {
  for (let n = 0; n < path.length - 1; n++) {
    if (path[n] && path[n + 1]) line(path[n], path[n + 1], rgb, width);
  }
};

let line = (a, b, rgb, width) => {
  let c = CG.subtract(b, a);
  width = width ? width : 0.01;
  m.save();
  m.translate(CG.mix(a, b, 0.5));
  m.aimZ(c);
  renderList
    .mTube3()
    .color(rgb ? rgb : [1, 1, 1])
    .size(width, width, CG.norm(c) / 2 + width * 0.99);
  m.restore();
};

let N = 3;

let vecs = [];
for (let y = -N; y <= N; y++)
  for (let x = -N; x <= N; x++)
    vecs.push([Math.random() - 0.5, Math.random() - 0.5]);

let nMode = DEBUG_MODE ? 4 : 0;
let nModeMax = 4;

let sCurve = (t) => t * t * (3 - 2 * t);

let nZ = (x, y, d00, d10, d01, d11) => {
  return (
    2 * (d00[0] * x + d00[1] * y) * sCurve(1 - x) * sCurve(1 - y) +
    2 * (d10[0] * (x - 1) + d10[1] * y) * sCurve(x) * sCurve(1 - y) +
    2 * (d01[0] * x + d01[1] * (y - 1)) * sCurve(1 - x) * sCurve(y) +
    2 * (d11[0] * (x - 1) + d11[1] * (y - 1)) * sCurve(x) * sCurve(y)
  );
};

let createTerrainMesh = () => {
  let e = 1 / 5,
    si = [];
  for (let y = -N; y <= N; y += 1) {
    for (let v = 0; v <= 1.001; v += e) {
      si.push([]);
      for (let x = -N; x <= N; x += 1) {
        let n = (2 * N + 1) * (y + N) + (x + N);
        for (let u = 0; u <= 1.001; u += e)
          si[si.length - 1].push([
            x + u,
            y + v,
            //nZ(u,v,vecs[n],vecs[n+1],vecs[n+2*N+1],vecs[n+2*N+2])
            nZ(u, v, vecs[0], vecs[1], vecs[2], vecs[3]),
          ]);
      }
    }
  }
  return CG.shapeImageToTriangleMesh(si);
};

let terrainMesh = null;

export let getViews = (views) => {
  viewMatrix = [];
  for (let view of views) viewMatrix.push(view.viewMatrix);
};

function buildStaticObj() {
  mBeginBuild();
  renderList.mCube().move(0,2,2).size(0.3);
  return mEndBuild();
}

function buildNoise(N) {
  let arr = new Array(N);
  
  for (let i = 0; i < N; i += 1) {
    arr[i] = buildNoiseVariant(i);
  }
  
  return arr;
}

function buildNoiseVariant(nMode) {
  mBeginBuild();

  m.save();
      m.translate(0,2,1);
      m.rotateX(-3.14159/2);
      m.scale(.2);
      let n = 0;
      for (let y = -N ; y <= N ; y += 1)
      for (let x = -N ; x <= N ; x += 1) {
         if (nMode < 4 && x < N) line(tmp.vec3(x,y,0),tmp.vec3(x+1,y,0), tmp.vec3(4,4,4));
         if (nMode < 4 && y < N) line(tmp.vec3(x,y,0),tmp.vec3(x,y+1,0), tmp.vec3(4,4,4));

         if (nMode > 0 && nMode < 4) line(tmp.vec3(x-.25,y,-vecs[n][0]/2), tmp.vec3(x+.25,y,vecs[n][0]/2), tmp.vec3(4,0,0));

         if (nMode > 1 && nMode < 4) line(tmp.vec3(x,y-.25,-vecs[n][1]/2), tmp.vec3(x,y+.25,vecs[n][1]/2), tmp.vec3(0,3,6));

  /*
         let e = 1/5;
         if (nMode >= 3 && x < N && y < N)
            for (let v = 0 ; v <= 1.001 ; v += e)
            for (let u = 0 ; u <= 1.001 ; u += e) {
         let z00 = nZ(u  , v  , vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
         let z10 = nZ(u+e, v  , vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
         let z01 = nZ(u  , v+e, vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
         if (u < .99) line([x+u,y+v,z00],[x+u+e,y+v,z10],[4,2,4],.003);
         if (v < .99) line([x+u,y+v,z00],[x+u,y+v+e,z01],[4,2,4],.003);
      }

  */
         if (nMode >= 3 && x < N && y < N) {
            let e = 1/8, f = 1/4;

            for (let u = 0 ; u <= .999 ; u += e)
            for (let v = 0 ; v <= 1.01 ; v += f) {
             let z0 = nZ(u  , v, vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
             let z1 = nZ(u+e, v, vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
             line(tmp.vec3(x+u,y+v,z0),tmp.vec3(x+u+e,y+v,z1),tmp.vec3(4,2,4),.003);
            }

            for (let v = 0 ; v <= .999 ; v += e)
            for (let u = 0 ; u <= 1.01 ; u += f) {
             let z0 = nZ(u, v  , vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
             let z1 = nZ(u, v+e, vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
             line(tmp.vec3(x+u,y+v,z0),tmp.vec3(x+u,y+v+e,z1),tmp.vec3(4,2,4),.004);
            }
         }

         n++;
      }
  /*
      if (terrainMesh) {
         let r = renderList().add(terrainMesh);
         r.color(white);
      }
  */

   m.restore();

   return mEndBuild();
}

export function renderListScene(time) {
  // NOISE GRID
  if (tMode == 2) {
    m.save();
       //m.translate(0, 2.0,0);
       //m.scale(1,.5 + .5 * Math.sin(time),1);
       //m.translate(0,-2.0,0);
       //mList(w.noiseRenderableLookup[nMode], drawShape);
       renderList.mFoo().move(0,1,0).turnX(-Math.PI/2).size(1,1,.5+.5*Math.sin(time)).color([10,0,10]);
    m.restore();
 }

  if (flatten >= 0) {
    zScale *= 0.97;
    flatten--;
  }

  if (KenDemo % 2)
    demoKen(time);

  if (MocapDemo % 2)
    demoMocap(time);

  if (ObjectsDemo % 2)
    demoObjects(time);

  if (ParticlesDemo % 2)
    demoParticles(time);


  if (cursorPath.length) {
    m.save();
    // m.translate(0, 0.5, 2.5);
    // m.scale(1 / FEET_TO_METERS);
    m.translate(0, 0, -0.5 * sCurve(1 - zScale));
    m.scale(1, 1, zScale);
    for (let n = 0; n < cursorPath.length; n++) {
      multiline(cursorPath[n], [10, 0, 10], 0.0013);
    }

    m.restore();
  }

  {
    mList(staticObjRenderable);
  }

}

/*
// GENERATE RANDOM PARTICLES WITHIN A UNIT SPHERE

let np = 10000;
let P = CG.particlesCreateMesh(np);
let R = [];
CG.random(0);
for (let n = 0, p = [100, 0, 0]; n < np; n++, p[0] = 100) {
  while (CG.dot(p, p) > 1)
    for (let i = 0; i < 3; i++) p[i] = 2 * CG.random() - 1;
  R.push([p[0], p[1], p[2], 0.003 + 0.012 * CG.random()]);
}
*/

let mocapFrame = 0;
let fingerNames = 'Hand,Thumb,Index,Middle,Ring,Little'.split(',');
let limbs = [[1, 3], [2, 4], [9, 8], [3, 5], [4, 6], [5, 18], [6, 19],
[10, 12], [11, 13], [12, 14], [13, 15], [14, 16], [15, 17],
[8, 50], [50, 7], [7, 0], [0, 1], [0, 2],

[16, 20], [20, 21], [21, 22],
[16, 23], [23, 24], [24, 25],
[16, 26], [26, 27], [27, 28],
[16, 29], [29, 30], [30, 31],
[16, 32], [32, 33], [33, 34],

[17, 35], [35, 36], [36, 37],
[17, 38], [38, 39], [39, 40],
[17, 41], [41, 42], [42, 43],
[17, 44], [44, 45], [45, 46],
[17, 47], [47, 48], [48, 49],
];

// DEMO TOGGLE BUTTONS. PLEASE KEEP THESE IN ALPHABETICAL ORDER.

addDemoButtons('Ken,Mocap,Objects,Particles,Speak');

