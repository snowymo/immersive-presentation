
import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoRachel = function () {
   //this.background = "./media/gltf/space/space.gltf";
   //this.background = "./media/tglt";
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;
    //m.save();
   
    this.display = () => {

      m.save();
      renderList.mSquare().move(0, 4.5, 0)
                           .turnY(time).color([10, 0, 0])
                           .setBaseTexture("font.png");

       m.save();
          let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));
          for (let n = 0 ; n < msg.length ; n++)
             C[n] = CG.mix(A[n], B[n], t);
          PT.layout(C, .5, .5);

          m.rotateY(time);
          m.scale(.6);
	  PT.render(renderList, m, [10,0,10]);
       m.restore();

       m.save();

      for (let n = 0 ; n < 8 ; n++) {
         m.save();
         m.scale(n==0 ? 0.15 : 0.1);

	 switch (n) {
	 case 0:
	 m.save();
	 m.rotateY(time);
         renderList.mSphere().move(0,10,0).turnX(-Math.PI/2).size(1.2).color([10, 10, 10]).setBaseTexture("suntexture.jpg");
	 m.restore();
	 break;

	 case 1:
         renderList.mSphere().move(Math.cos(time * 0.6) * 3,15, Math.sin(time * 0.6) * 3).size(0.5).turnX(-Math.PI/2).turnY(time).color([1, 1, 1]).setBaseTexture("mercurytexture.png");
         renderList.mSphere().move(Math.cos(time * 0.6) * 5.5,15, Math.sin(time * 0.6) * 5.5).size(0.6).turnY(time).color([1, 1, 1]).setBaseTexture("venustexture.jpg");
         renderList.mSphere().move(Math.cos(time * 0.5) * 8,15, Math.sin(time * 0.5) * 8).size(0.8).turnY(time).color([1, 1, 1]).setBaseTexture("marstexture.jpeg");
         renderList.mSphere().move(Math.cos(time * 1.2) * 10.5,15, Math.sin(time * 1.2) * 10.5).turnX(-Math.PI/2).turnY(time).color([1, 1, 1]).setBaseTexture("earth_texture.png");
         renderList.mSphere().move(Math.cos(time * 0.7) * 13,15, Math.sin(time * 0.7) * 13).turnY(time).color([1, 1, 1]).setBaseTexture("moontexture.jpeg");
         renderList.mSphere().move(Math.cos(time * 0.4) * 15.2,15, Math.sin(time * 0.4) * 15.2).size(1.7).turnY(time).color([1, 1, 1]).setBaseTexture("jupitertexture.jpg");
         //renderList.mTorus().move(Math.cos(time * 0.4) * 15.2,15, Math.sin(time * 0.4) * 15.2).size(1.3).turnY(time).color([1, 0, 1]).turnZ(10);
         renderList.mSphere().move(Math.cos(time * 0.3) * 18,15, Math.sin(time * 0.3) * 18).turnY(time).color([1, 1, 1]).setBaseTexture("uranustexture.jpg");
         renderList.mSphere().move(Math.cos(time * 0.65) * 20.5,15, Math.sin(time * 0.65) * 20.5).size(1.2).turnY(time).color([1, 1, 1]).setBaseTexture("neptunetexture.jpg");
         renderList.mSphere().move(Math.cos(time * 0.2) * 23,15, Math.sin(time * 0.2) * 23).size(0.4).turnY(time).color([1, 1, 1]).setBaseTexture("plutotexture.jpeg");
         
         //renderList.mCube().turnY(time).color([1, 1, 1]).translate(1,1,1).setBaseTexture("brick.png");
         break;

	 /*case 2:
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
	 break;*/
         }
         m.restore();
      }
      m.restore();
      
   };
       /*m.translate(0,1.5 + .5 * Math.sin(3 * time),-1);
       m.translate(0,0,0);
       if (Math.floor(time) % 10 < 5)
          renderList.mCube().size(.2).turnY(time).color([0,1,0]);
       else
          renderList.mCylinder().size(.2).turnY(time).color([1,0,0]);
    m.restore();*/
};

let msg = '  Solar\nSystem\n   ';
let PT = new CG.ParticlesText(msg);

let A = PT.layout(null, .5,.5), B = [], C = [];
for (let n = 0 ; n < msg.length ; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [1];
   C[n] = B[n].slice();
}


export let demoRachel = new DemoRachel();
