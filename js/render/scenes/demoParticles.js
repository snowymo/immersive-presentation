
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { viewMatrix } from "./renderListScene.js";

export let demoParticles = time => {

    // ANIMATE THE PARTICLES

    for (let n = 0; n < np; n++) {
      for (let j = 0; j < 3; j++)
        R[n][j] += .004 * improvedNoise.noise(time + R[n][0], time + n + R[n][1], time + j + R[n][2]);
      let x = R[n][0], y = R[n][1], z = R[n][2];
      if (x * x + y * y + z * z > .9)
        for (let j = 0; j < 3; j++)
          R[n][j] *= .99;
    }

    // RENDER THE PARTICLES AS A SINGLE MESH

    m.save();
       m.translate(0, 1.5, -.4);
       m.rotateY(time / 10);
       m.scale(.3);
       CG.particlesSetPositions(P, R, CG.matrixMultiply(viewMatrix[0], m.value()));
       renderList.mMesh(P).color([2, 2, 2]);//.isParticles(true);
    m.restore();
}

let improvedNoise = new ImprovedNoise();

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

