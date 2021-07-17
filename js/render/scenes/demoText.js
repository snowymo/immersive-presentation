import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoText = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;

  this.display = () => {
    m.save();
       m.translate(0, 1.5, 0);
       m.scale(0.1);

       renderList.mSquare().move(0, 4.5, 0)
                           .turnY(time).color([10, 0, 0])
                           .setBaseTexture("font.png");

       m.save();
          let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));
          for (let n = 0 ; n < msg.length ; n++)
             C[n] = CG.mix(A[n], B[n], t);
          PT.layout(C, .5, .5);

          m.rotateY(1);
          m.scale(.6);
	  PT.render(renderList, m, [10,0,10]);
       m.restore();

    m.restore();
  };
};

let msg = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi at lobortis nulla. Nunc sed neque sem. Sed quis quam tortor.';
let PT = new CG.ParticlesText(msg);

let A = PT.layout(null, .5,.5), B = [], C = [];
let len = ((-1 - msg.length) / 3) * -1;
let spaceCount = msg.length / 3;
let lineNum = 0;
//centered
//console.log(msg.length);
for (let n = 0 ; n < msg.length ; n++) {
   
   if (msg[n] == " " && n >= spaceCount){
      lineNum++;
      spaceCount *= 2;
      //B[n] = [n - (len*Math.floor(n/len)), 0 - Math.floor(n/len), 0];
   }
   console.log("n ",n);
   console.log("lineNum ",lineNum);
   console.log("spaceCount ", spaceCount);
   console.log("mathfloor ",Math.floor(n/len));
   console.log("len", len);
   console.log("len* mathfloor ", len*Math.floor(n/len));
   console.log(" n - len*mathfloor ",n - (len*Math.floor(n/len)));
   console.log("n - len*linenum ", n - (len*lineNum));
   //B[n] = [n - (len*Math.floor(n/len)), 0 - Math.floor(n/len), 0];
   B[n] = [n - (len*lineNum), lineNum, 0];
   C[n] = B[n].slice();
   console.log("arr ", C[n])
   
}

/*
TO DO:
right align, left align
word based vs character baseds
*/
export let demoText = new DemoText();
