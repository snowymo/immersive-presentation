import { m, renderList } from "../core/renderList.js";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { time, viewMatrix } from "../core/renderListScene.js";


let DemoRohail = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;

  this.display = () => {

    for (let n = 0; n < np; n++) {
      for (let j = 0; j < 3; j++)
        R[n][j] +=
          0.004 *
          improvedNoise.noise(
            time + R[n][0],
            time + n + R[n][1],
            time + j + R[n][2]
          );
      let x = R[n][0],
        y = R[n][1],
        z = R[n][2];
      if (x * x + y * y + z * z > 0.9)
        for (let j = 0; j < 3; j++) R[n][j] *= 0.99;
    }

     m.save();
        m.translate(0,1.5,0);
        
        m.save();
          m.rotateX(Math.PI/2);
          m.rotateX(.1);
          m.rotateZ(.1);
          m.scale(6, 6, 0.03);
          renderList.mTorus().color([0,0,0]).size(0.05);//.opacity(0.5);
        m.restore();

        m.save();          
          renderList.mSphere().size(0.12).color([.97, .84, .10]);
        m.restore();

        m.save();
          m.rotateX(3.25);
          m.scale(0.43,0.15,0.43);
          CG.particlesSetPositions(P, R, CG.matrixMultiply(viewMatrix[0], m.value()));
          renderList.mMesh(P).color([10, 10, 10]); //.isParticles(true);
        m.restore();

        m.save();
        m.translate(0.3 * Math.cos(time), 0, 0.3 * Math.sin(time));
        m.rotateY(time);
              renderList.mSphere().turnX(-Math.PI/2).size(0.05).color([1, 1, 1]).setBaseTexture("earth_texture.png");
        m.restore();

        
        let nrays = 10;
        let currValue = 4;
        for (let n = 0; n < nrays; n++) {
          m.save();
            m.rotateX(5 * Math.PI * Math.random());
            m.rotateZ(5 * Math.PI * Math.random());
            if (time % 3 < 0.3) {
              currValue = 2 * Math.random();
            }
            m.scale(0.05, currValue, 0.05);

            renderList.mCylinder().size(0.06).color([.9, .65, .1]);
          m.restore();
        }

     m.restore();
  };

  let improvedNoise = new ImprovedNoise();

  // GENERATE RANDOM PARTICLES WITHIN A UNIT SPHERE

  let np = 40000;
  let P = CG.particlesCreateMesh(np);
  let R = [];
  CG.random(0);
  for (let n = 0, p = [100, 0, 0]; n < np; n++, p[0] = 100) {
    while (CG.dot(p, p) > 1)
      for (let i = 0; i < 3; i+=2) p[i] = 2 * CG.random() - 1;
    R.push([p[0], p[1], p[2], 0.003 + 0.012 * CG.random(), 1, 1, 1]);
  }
};

export let demoRohail = new DemoRohail();
