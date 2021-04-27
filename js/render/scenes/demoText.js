import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoText = function () {
  this.background = "../../media/gltf/home-theater/home-theater.gltf";
  this.loadGLTF = false;
  this.envInd = null;

  this.display = () => {
    m.save();
       m.translate(0, 0, -0.4);
       m.scale(0.04);

       renderList.mSquare().move(1.5, 4.5, 0)
                           .turnY(time).color([10, 10, 10])
                           .setBaseTexture("font.png");

       m.save();
          m.translate(0,0,3);
          m.rotateY(Math.sin(2*time));
          m.translate(-2,1,0);
          m.scale(.3,.6,.6);

          let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));
          for (let n = 0 ; n < msg.length ; n++)
             C[n] = CG.mix(A[n], B[n], t);

          PT.layout(C);
          renderList.mMesh(PT.mesh()).color([10, 10, 0])
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
