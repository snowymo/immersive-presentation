"use strict";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { rokokoData } from "../../data/RokokoData.js";

/*
for (let i = 0; i < rokokoData.length; i++) {
   let frame = rokokoData[i].frameIndex;
   let bones = rokokoData[i].Bones;
   for (let j = 0 ; j < bones.length ; j++) {
      let id = bones[j].BoneName;
      let px = bones[j].px;
      let py = bones[j].py;
      let pz = bones[j].pz;
      let qx = bones[j].qx;
      let qy = bones[j].qy;
      let qz = bones[j].qz;
      console.log(frame, id, px);
   }
}
*/

let viewMatrix = [];
let improvedNoise = new ImprovedNoise();

const FEET_TO_METERS = 0.3048;

let handPos = { left: [], right: [] };
let grab = { left: false, right: false };
let justGrab = { left: true, right: true };

let controllerMatrix = { left: [], right: [] };
let buttonState = { left: [], right: [] };
for (let i = 0; i < 7; i++) buttonState.left[i] = buttonState.right[i] = false;

const validHandedness = ["left", "right"];

let flatten = 0,
  zScale = 1;
let cursorPath = [];
let tMode = 0;

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

let nMode = 0;

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

let terrainMesh;

export let getViews = (views) => {
  viewMatrix = []
  for (let view of views)
    viewMatrix.push(view.viewMatrix);
}

export function renderListScene(time) {
  // NOISE GRID
  // if (tMode == 2) {
  //   m.save();
  //   //  m.translate(0, 0.5, 0);
  //   m.rotateX(-3.14159 / 2);
  //   //  m.scale(0.9);
  //   let n = 0;
  //   for (let y = -N; y <= N; y += 0.1)
  //     for (let x = -N; x <= N; x += 0.1) {
  //       if (nMode < 4 && x < N) line([x, y, 0], [x + 1, y, 0], [4, 4, 4]);
  //       if (nMode < 4 && y < N) line([x, y, 0], [x, y + 1, 0], [4, 4, 4]);

  //       if (nMode > 0 && nMode < 4)
  //         line(
  //           [x - 0.25, y, -vecs[n][0] / 2],
  //           [x + 0.25, y, vecs[n][0] / 2],
  //           [4, 0, 0]
  //         );

  //       if (nMode > 1 && nMode < 4)
  //         line(
  //           [x, y - 0.25, -vecs[n][1] / 2],
  //           [x, y + 0.25, vecs[n][1] / 2],
  //           [0, 3, 6]
  //         );

  //       /*
  //             let e = 1/5;
  //             if (nMode >= 3 && x < N && y < N)
  //                for (let v = 0 ; v <= 1.001 ; v += e)
  //                for (let u = 0 ; u <= 1.001 ; u += e) {
  //               let z00 = nZ(u  , v  , vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
  //               let z10 = nZ(u+e, v  , vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
  //               let z01 = nZ(u  , v+e, vecs[n], vecs[n+1], vecs[n+2*N+1], vecs[n+2*N+2]);
  //               if (u < .99) line([x+u,y+v,z00],[x+u+e,y+v,z10],[4,2,4],.003, renderList);
  //               if (v < .99) line([x+u,y+v,z00],[x+u,y+v+e,z01],[4,2,4],.003, renderList);
  //            }
       
  //      */
  //       if (nMode >= 3 && x < N && y < N) {
  //         let e = 1 / 8,
  //           f = 1 / 4;

  //         for (let u = 0; u <= 0.999; u += e)
  //           for (let v = 0; v <= 1.01; v += f) {
  //             let z0 = nZ(
  //               u,
  //               v,
  //               vecs[n],
  //               vecs[n + 1],
  //               vecs[n + 2 * N + 1],
  //               vecs[n + 2 * N + 2]
  //             );
  //             let z1 = nZ(
  //               u + e,
  //               v,
  //               vecs[n],
  //               vecs[n + 1],
  //               vecs[n + 2 * N + 1],
  //               vecs[n + 2 * N + 2]
  //             );
  //             line(
  //               [x + u, y + v, z0],
  //               [x + u + e, y + v, z1],
  //               [4, 2, 4],
  //               0.003
  //             );
  //           }

  //         for (let v = 0; v <= 0.999; v += e)
  //           for (let u = 0; u <= 1.01; u += f) {
  //             let z0 = nZ(
  //               u,
  //               v,
  //               vecs[n],
  //               vecs[n + 1],
  //               vecs[n + 2 * N + 1],
  //               vecs[n + 2 * N + 2]
  //             );
  //             let z1 = nZ(
  //               u,
  //               v + e,
  //               vecs[n],
  //               vecs[n + 1],
  //               vecs[n + 2 * N + 1],
  //               vecs[n + 2 * N + 2]
  //             );
  //             line(
  //               [x + u, y + v, z0],
  //               [x + u, y + v + e, z1],
  //               [4, 2, 4],
  //               0.004
  //             );
  //           }
  //       }

  //       n++;
  //     }
  //   /*
  //          if (terrainMesh) {
  //             let r = renderList.add(terrainMesh);
  //             r.color(white);
  //          }
  //      */

  //   m.restore();
  // }


  if (flatten >= 0) {
    zScale *= 0.97;
    flatten--;
  }

  if (window.isDemoObjects) {
     m.save();
        m.translate(0,1.5,-.4);
        m.scale(.04);
	renderList.mCube()           .move(-4.5, 4.5,0).turnY(time).color([1,1,1]);
	renderList.mQuad()           .move(-1.5, 4.5,0).turnY(time).color([1,1,1]);
	renderList.mSquare()         .move( 1.5, 4.5,0).turnY(time).color([1,1,1]);
	renderList.mSphere()         .move( 4.5, 4.5,0).turnY(time).color([1,1,1]);
	renderList.mCylinder()       .move(-4.5, 1.5,0).turnY(time).color([1,1,1]);
	renderList.mRoundedCylinder().move(-1.5, 1.5,0).turnY(time).color([1,1,1]);
	renderList.mTorus()          .move( 1.5, 1.5,0).turnY(time).color([1,1,1]);
	renderList.mDisk()           .move( 4.5, 1.5,0).turnY(time).color([1,1,1]);
	renderList.mCone()           .move(-4.5,-1.5,0).turnY(time).color([1,1,1]);
	renderList.mTube()           .move(-1.5,-1.5,0).turnY(time).color([1,1,1]);
	renderList.mTube3()          .move( 1.5,-1.5,0).turnY(time).color([1,1,1]);
	renderList.mGluedCylinder()  .move( 4.5,-1.5,0).turnY(time).color([1,1,1]);
     m.restore();
  }

  if (window.isDemoParticles) {
     m.save();
        m.translate(0,1.5,-.4);
        m.rotateY(time / 10);
        m.scale(.3);

        // ANIMATE THE PARTICLES

        for (let n = 0 ; n < np ; n++) {
           for (let j = 0 ; j < 3 ; j++)
              R[n][j] += .004 * improvedNoise.noise(time + R[n][0], time + n + R[n][1], time + j + R[n][2]);
	   let x = R[n][0], y = R[n][1], z = R[n][2];
	   if (x*x + y*y + z*z > .9)
	      for (let j = 0 ; j < 3 ; j++)
	         R[n][j] *= .99;
        }

        // RENDER THE PARTICLES AS A SINGLE MESH

        CG.particlesSetPositions(P, R, CG.matrixMultiply(viewMatrix[0],m.value()));
        renderList.mMesh(P).color([1,1,1]);//.isParticles(true);
     m.restore();
  }

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
}

// GENERATE RANDOM PARTICLES WITHIN A UNIT SPHERE

let np = 10000;
let P = CG.particlesCreateMesh(np);
let R = [];
CG.random(0);
for (let n = 0, p = [100,0,0] ; n < np ; n++, p[0] = 100) {
   while (CG.dot(p, p) > 1)
      for (let i = 0 ; i < 3 ; i++)
         p[i] = 2 * CG.random() - 1;
   R.push([p[0], p[1], p[2], .003 + .012 * CG.random()]);
}

// ADD DEMO TOGGLE BUTTONS TO WEB PAGE

addDemoButtons('Particles,Objects');


