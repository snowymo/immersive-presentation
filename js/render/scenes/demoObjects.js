import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoObjects = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
      m.save();
      m.translate(0, 1.5, 0);
      m.scale(0.1);

      renderList.mCube().move(-4.5, 4.5, 0)
         .turnY(time).color([1, 1, 1])
         .setBaseTexture("brick.png");
      renderList.mQuad().move(-1.5, 4.5, 0)
         .turnY(time).color([1, 1, 1])
         .setBaseTexture("stones.jpg");;
      renderList.mSquare().move(1.5, 4.5, 0)
         .turnY(time).color([10, 10, 10])
         .setBaseTexture("font.png");
      renderList.mSphere().move(4.5, 4.5, 0)
         .turnY(time).color([1, 1, 1]);

      renderList.mCylinder().move(-4.5, 1.5, 0)
         .turnY(time).color([1, 1, 1])
         .textureView(window.textures[1].lookupImageByID(1))
         .textureAtlas(window.textures[1]);
      renderList.mRoundedCylinder().move(-1.5, 1.5, 0)
         .turnY(time)
         .color([1, 1, 1])
         .textureView(window.textures[2].lookupImageByID(1))
         .textureAtlas(window.textures[2]);
      renderList.mTorus().move(1.5, 1.5, 0)
         .turnY(time).color([1, 1, 1]);
      renderList.mDisk().move(4.5, 1.5, 0)
         .turnY(time).color([1, 1, 1]);

      renderList.mCone().move(-4.5, -1.5, 0)
         .turnY(time).color([1, 1, 1]);
      renderList.mTube().move(-1.5, -1.5, 0)
         .turnY(time).color([1, 1, 1]);
      renderList.mTube3().move(1.5, -1.5, 0)
         .turnY(time).color([1, 1, 1]);
      renderList.mGluedCylinder().move(4.5, -1.5, 0)
         .turnY(time)
         .color([1, 1, 1]);

      m.save();
      m.translate(0, 0, 3);
      m.rotateY(Math.sin(2 * time));
      m.translate(-2, 1, 0);
      m.scale(.3, .6, .6);

      let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));
      for (let n = 0; n < msg.length; n++)
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
for (let n = 0; n < msg.length; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [10 * Math.cos(theta) + 6, 5 * Math.sin(theta) - 1, 0];
   C[n] = B[n].slice();
}

export let demoObjects = new DemoObjects();
