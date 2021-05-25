import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoText = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;

  console.log('hi mom');

  this.display = () => {
    m.save();
       m.translate(0, 1.5, 0);
       m.scale(0.1);

       renderList.mSquare().move(0, 4.5, 0)
                           .turnY(time).color([10, 0, 0])
                           .setBaseTexture("font.png");

       m.save();
          m.rotateY(time);
          m.translate(-2,0,0);
          m.scale(.3,.6,.6);

          let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));
          for (let n = 0 ; n < msg.length ; n++)
             C[n] = CG.mix(A[n], B[n], t);

          PT.layout(C);
          renderList.mMesh(PT.mesh()).color([10, 0, 10])
                                     .setBaseTexture('font.png');
       m.restore();

    m.restore();
  };
};

let msg = '  These are\nsome Metaroom\n   objects';
let PT = new CG.ParticlesText(msg);

let A = PT.layout(), B = [], C = [];
for (let n = 0 ; n < msg.length ; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [10 * Math.cos(theta) + 6, 5 * Math.sin(theta) - 1, 0];
   C[n] = B[n].slice();
}

export let demoText = new DemoText();
