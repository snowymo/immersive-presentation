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

let flatten = 0,
  zScale = 1;
let cursorPath = [];
let tMode = 0;
let justReleased = true;


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

let sCurve = (t) => t * t * (3 - 2 * t);

let nZ = (x, y, d00, d10, d01, d11) => {
  return (
    2 * (d00[0] * x + d00[1] * y) * sCurve(1 - x) * sCurve(1 - y) +
    2 * (d10[0] * (x - 1) + d10[1] * y) * sCurve(x) * sCurve(1 - y) +
    2 * (d01[0] * x + d01[1] * (y - 1)) * sCurve(1 - x) * sCurve(y) +
    2 * (d11[0] * (x - 1) + d11[1] * (y - 1)) * sCurve(x) * sCurve(y)
  );
};

let DemoDraw = function () {
  // Process Controller Info
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;

  this.display = () => {
    if (isPressed) {
      justReleased = true;
      if (buttonState.left[0] && tMode == 0) {
        zScale = 1;
        cursorPath.push([]);
      }
    } else if (isDragged && tMode == 0) {
      if (buttonState.left[0])
        if (controllerMatrix.left) {
          let P = controllerMatrix.left.slice(12, 15);
          cursorPath[cursorPath.length - 1].push(P);
        }
    } else if (isReleased) {
      if (justReleased) {
        justReleased = false;
        tMode = (tMode + 1) % 2;
        switch (tMode) {
          case 0:
            flatten = 50;
            break;
          case 1:
            cursorPath = [];
            break;
        }
      }
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
  };
};

export let demoDraw = new DemoDraw();
