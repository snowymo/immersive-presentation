import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";
import { mat4, vec4 } from "../math/gl-matrix.js";

const CAMERA_W_POSITION = 3;
const CAMERA_FOCAL_LENGTH = 1;


class Tesseract {
  constructor() {
    this.points = [];

    // Set up the cube points
    for(let x = -1; x <= 1; x += 2) {
      for(let y = -1; y <= 1; y += 2) {
        for(let z = -1; z <= 1; z += 2) {
          for(let w = -1; w <= 1; w += 2) {
            const pt = vec4.create();
            vec4.set(pt, x, y, z, w);
            this.points.push(pt);
          }
        }
      }
    }

    // TODO: Set up cube triangles/lines

    this.rotationMatrix = mat4.create();
    mat4.identity(this.rotationMatrix);
    this.cameraPoint = vec4.create();
    this.focalLength = CAMERA_FOCAL_LENGTH;
    vec4.set(this.cameraPoint, 0, 0, 0, CAMERA_W_POSITION);

    this.projected = [];
  }

  getPoints() {
    return this.points.map((p, idx) => this.project(p, idx));
  }

  project(pt, i) {
    if (!this.projected[i]) this.projected[i] = vec4.create();
    let out = this.projected[i];

    // Rotate
    vec4.transformMat4(out, pt, this.rotationMatrix);

    // Find t where w = c-f
    const t = -this.focalLength / (out[3] - this.cameraPoint[3]);

    vec4.set(out, 
      this.cameraPoint[0] * (1-t) + out[0] * t,
      this.cameraPoint[1] * (1-t) + out[1] * t,
      this.cameraPoint[2] * (1-t) + out[2] * t,
      t
    );

    return out;
  }

  updateRotation(t) {
    // TODO: Generate an isoclinic rotation
    // https://en.wikipedia.org/wiki/Rotations_in_4-dimensional_Euclidean_space#Double_rotations

    this.rotationMatrix[10] = Math.cos(t);
    this.rotationMatrix[11] = -Math.sin(t);
    this.rotationMatrix[14] = Math.sin(t);
    this.rotationMatrix[15] = Math.cos(t);
  }
}
let DemoChris = function () {
  this.loadGLTF = false;
  this.envInd = null;
  this.tess = new Tesseract();
  this.theta = 0;
  this.display = () => {
    m.save();
    this.theta += 0.01;
    this.tess.updateRotation(this.theta);

    // TODO: Generate lines or a transparent square
    this.tess.getPoints().forEach(p => {
      let [x, y, z, w] = p;
      m.save();
        m.translate(0, 1.5, 0);
        m.scale(1/3);
        renderList.mSphere()
          .size(.1, .1, .1)
          .move(x, y, z);
      m.restore();
    });
    m.restore();
  };
};

export let demoChris = new DemoChris();
