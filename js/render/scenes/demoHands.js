
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { rokokoData } from "../../data/RokokoData.js";
import { bodyData } from "../../data/BodyData.js";
import { time } from "../core/renderListScene.js";

let DemoHands = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
      m.save();

	 let mocapFrame = Math.floor(30 * time) % bodyData.length,
             bones = bodyData[mocapFrame].Bones;

         let r = j => {
	    let k = Math.floor(((j - 20) % 15) / 3);
	    return k == 0 ? .011 : k < 4 ? .008 : .007;
         }

         for (let j = 0; j < bones.length; j++)
         for (let n = 0; n < fingerNames.length; n++)
            if (bones[j].BoneName.indexOf(fingerNames[n]) >= 0) {
               m.save();
                  m.translate(bones[j].px, bones[j].py, bones[j].pz);
                  m.rotateZ(bones[j].qz);
                  m.rotateY(bones[j].qy);
                  m.rotateX(bones[j].qx);
                  renderList.mSphere().size(r(j)).color([2, 1, 1]);
               m.restore();
           }

         for (let n = 19; n < limbs.length; n++) {
	    if ((n - 19) % 3 == 2) continue;
            let i = limbs[n][0], j = limbs[n][1],
                A = [bones[i].px, bones[i].py, bones[i].pz],
                B = [bones[j].px, bones[j].py, bones[j].pz];
            m.save();
               m.translate(CG.mix(A, B, .5));
               let AB = CG.subtract(B, A);
               m.aimZ(AB);
               m.scale(r(j), r(j), CG.norm(AB) / 2);
               renderList.mCylinder().color([2, 1, 1]);;
            m.restore();
         }

      m.restore();
   }
}

export let demoHands = new DemoHands();

//let fingerNames = 'Hand,Thumb,Index,Middle,Ring,Little'.split(',');
let fingerNames = 'Thumb,Index,Middle,Ring,Little'.split(',');
let limbs = [
   [1, 3], [2, 4], [9, 8], [3, 5], [4, 6], [5, 18], [6, 19],
   [10, 12], [11, 13], [12, 14], [13, 15], [14, 16], [15, 17],
   [8, 50], [50, 7], [7, 0], [0, 1], [0, 2],

   [16, 20], [20, 21], [21, 22],
   [16, 23], [23, 24], [24, 25],
   [16, 26], [26, 27], [27, 28],
   [16, 29], [29, 30], [30, 31],
   [16, 32], [32, 33], [33, 34],

   [17, 35], [35, 36], [36, 37],
   [17, 38], [38, 39], [39, 40],
   [17, 41], [41, 42], [42, 43],
   [17, 44], [44, 45], [45, 46],
   [17, 47], [47, 48], [48, 49],
];

