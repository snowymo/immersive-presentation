import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoObjects = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
      m.save();
      m.translate(0, 1, 0);

      for (let n = 0 ; n < 8 ; n++) {
         m.save();
         m.rotateY(2 * Math.PI * n / 7);
         m.translate(n==0 ? 0 : .5, n==0 ? 0.05 : 0, 0);
         m.scale(n==0 ? 0.15 : 0.1);

	 switch (n) {
	 case 0:
	 m.save();
	 m.rotateY(time);
         renderList.mSphere().turnX(-Math.PI/2).color([1, 1, 1]).setBaseTexture("earth_texture.png");
	 m.restore();
	 break;

	 case 1:
         renderList.mCube().turnY(time).color([1, 1, 1]).setBaseTexture("brick.png");
         break;

	 case 2:
         renderList.mQuad().turnY(time).color([1, 1, 1]).setBaseTexture("stones.jpg");;
	 break;

	 case 3:
         renderList.mSquare().turnY(time).color([10, 0, 0]).setBaseTexture("font.png");
	 break;

	 case 4:
         renderList.mCylinder().turnY(time).color([1, 1, 1])
	           .textureView(window.textures[1].lookupImageByID(1)).textureAtlas(window.textures[1]);
	 break;

	 case 5:
         renderList.mRoundedCylinder().turnY(time).color([1, 1, 1])
	           .textureView(window.textures[2].lookupImageByID(1)).textureAtlas(window.textures[2]);
	 break;

	 case 6:
         renderList.mTorus().turnY(time).color([1, 1, 1]);
	 break;

	 case 7:
         renderList.mCone().turnY(time).color([1, 1, 1]);
	 break;
         }
         m.restore();
      }
      m.restore();
   };
};

export let demoObjects = new DemoObjects();
