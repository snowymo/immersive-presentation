import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import {
  m,
  renderList,
  mList,
  mBeginBuild,
  mEndBuild,
} from "../core/renderList.js";
import {
  time,
  viewMatrix,
  controllerMatrix,
  buttonState,
  isReleased,
  isDragged,
  isPressed,
} from "../core/renderListScene.js";

const FEET_TO_METERS = 0.3048;
const DEBUG_MODE = false;

let flatten = 0,
  zScale = 1;
let cursorPath = [];
let tMode = DEBUG_MODE ? 2 : 0;
let tModeMax = 2;

function convertToStaticMesh(renderList) {
    const itemInfo = renderList.getItems();
    const items    = itemInfo.list;
    const count    = itemInfo.count;
  
    for (let i = 0; i < count; i += 1) {
       if (items[i].mesh)
         continue;
  
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
    for (let i = 0; i < noiseRenderableLookup.length; i += 1)
       convertToStaticMesh(w.noiseRenderableLookup[i]);
  }
  
  let multiline = (path, rgb, width) => {
    for (let n = 0; n < path.length - 1; n++)
       if (path[n] && path[n + 1]) line(path[n], path[n + 1], rgb, width);
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
               nZ(u, v, vecs[0], vecs[1], vecs[2], vecs[3]),
             ]);
         }
       }
    }
    return CG.shapeImageToTriangleMesh(si);
  };
  
  let terrainMesh = null;

  function buildStaticObj() {
    mBeginBuild();
    renderList.mCube().move(0,2,2).size(0.3);
    return mEndBuild();
  }
  
  function buildNoise(N) {
    let arr = new Array(N);
    
    for (let i = 0; i < N; i += 1)
       arr[i] = buildNoiseVariant(i);
    
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
  
     m.restore();
  
     return mEndBuild();
  }
  

export let demoNoiseGrid = () => {
  // Process Controller Info
  if (isPressed) {
    if (buttonState.left[0]) {
      zScale = 1;
      cursorPath.push([]);
    }
  } else if (isDragged) {
    if (buttonState.left[0])
      if (controllerMatrix.left) {
        let P = controllerMatrix.left.slice(12, 15);
        cursorPath[cursorPath.length - 1].push(P);
      }
  } else if (isReleased) {
    if (buttonState.left[1]) {
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

    if (buttonState.right[0]) nMode = (nMode + 1) % 5;
  }

  // NOISE GRID
  tMode = 2;
  if (tMode == 2) {
    m.save();
    renderList
      .mFoo()
      .move(0, 1, 0)
      .turnX(-Math.PI / 2)
      .size(1, 1, 0.5 + 0.5 * Math.sin(time))
      .color([10, 0, 10]);
    m.restore();
  }

  if (flatten >= 0) {
    zScale *= 0.97;
    flatten--;
  }

  if (cursorPath.length) {
    m.save();
    m.translate(0, 0, -0.5 * sCurve(1 - zScale));
    m.scale(1, 1, zScale);
    for (let n = 0; n < cursorPath.length; n++)
      multiline(cursorPath[n], [10, 0, 10], 0.0013);
    m.restore();
  }

  mList(staticObjRenderable);
};
