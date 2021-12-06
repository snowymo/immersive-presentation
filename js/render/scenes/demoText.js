import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";
import * as keyboardInput from "../../util/input_keyboard.js";
import {
   viewMatrix,
   controllerMatrix,
   buttonState,
 } from "../core/renderListScene.js";

let xPos = 0;
let yPos = 1.5;
let zPos = 1;
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
          
          m.scale(.6);
          m.translate(xPos, yPos, 0);
	  PT.render(renderList, m, [10,0,10]);
       m.restore();

    m.restore();
    
  };
};

let msg = '';
let PT = new CG.ParticlesText(msg);
let A = PT.layout(null, .5,.5), B = [], C = [];
document.addEventListener("mousemove", (event) =>{
   if (event.buttons & 1) {
      xPos += event.movementX / 5;
      yPos += event.movementY / 5;
      zPos = window.avatars[window.playerid].headset.position.z + 1;
    }
});

document.addEventListener("keydown", (event) => {
 
   if (event.keyCode == 9){
      msg += '    ';
   }
   else if (event.keyCode == 13){
      msg += '\n';
   }
   else if (event.keyCode == 32){
      msg += ' ';
   }
   else if (event.keyCode == 8){
      msg.slice(0, -1);
   }
   else if ((event.keyCode == 91) || (event.keyCode == 16) || (event.keyCode == 27)){
      msg += '';
   }
  else if ((48 <= event.keyCode <= 90) && (keyboardInput.keyIsUp(event.keyCode))) {
     msg += event.key;
   }
   
    PT = new CG.ParticlesText(msg);
 });

for (let n = 0 ; n < msg.length ; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [10 * Math.cos(theta), 5 * Math.sin(theta), 0];
   C[n] = B[n].slice();
 
}

export let demoText = new DemoText();