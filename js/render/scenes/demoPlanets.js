
import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoPlanets = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;
   
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
	 m.translate(0,1.1,0);
	 m.scale(.25);
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
         renderList.mSphere().move(Math.cos(time * 0.3) * 18,15, Math.sin(time * 0.3) * 18).turnY(time).color([1, 1, 1]).setBaseTexture("uranustexture.jpg");
         renderList.mSphere().move(Math.cos(time * 0.65) * 20.5,15, Math.sin(time * 0.65) * 20.5).size(1.2).turnY(time).color([1, 1, 1]).setBaseTexture("neptunetexture.jpg");
         renderList.mSphere().move(Math.cos(time * 0.2) * 23,15, Math.sin(time * 0.2) * 23).size(0.4).turnY(time).color([1, 1, 1]).setBaseTexture("plutotexture.jpeg");
         
         break;

         }
         m.restore();
      }
      m.restore();
      
   };
       
};

let msg = '  Solar\nSystem\n   ';
let PT = new CG.ParticlesText(msg);

let A = PT.layout(null, .5,.5), B = [], C = [];
for (let n = 0 ; n < msg.length ; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [1];
   C[n] = B[n].slice();
}


export let demoPlanets = new DemoPlanets();
