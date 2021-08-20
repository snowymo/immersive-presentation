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

// make array of words in a string
let PT = new CG.ParticlesText(msg);
let wordlst = [];
let tempword = '';
for (let i = 0; i < msg.length; i++){
   if (msg[i] == ' '){
      wordlst.push(tempword);
      tempword = '';
   }
   else{
      tempword += msg[i];
   }

}
wordlst.push(tempword);

let A = PT.layout(null, .5,.5), B = [], C = [];
let len = ((-1 - msg.length) / 3) * -1;

/*
// Character by character count
for (let n = 0 ; n < msg.length ; n++) {

   B[n] = [n - (len*Math.floor(n/len)), 0 - Math.floor(n/len), 0];
   C[n] = B[n].slice();
   
}
*/

let lineNum = 0;
let spaceCount = wordlst.length / 3;
let msglen = 0;
let wordlsttotLen = 0;

// word by word count
for (let n = 0 ; n < wordlst.length ; n++){
   for (let i = 0; i < wordlst[n].length; i++){
         B[msglen] = [i + wordlsttotLen, lineNum, 0];
         C[msglen] = B[msglen].slice();
         msglen++;
   }
   wordlsttotLen += wordlst[n].length;
   if(n > spaceCount){
      lineNum -= 1;
      spaceCount *= 2;
      wordlsttotLen = 0;
   }
}
export let demoText = new DemoText();
