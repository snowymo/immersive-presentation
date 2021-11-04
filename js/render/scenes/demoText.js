import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";
import * as keyboardInput from "../../util/input_keyboard.js";
import {
   viewMatrix,
   controllerMatrix,
   buttonState,
 } from "../core/renderListScene.js";
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
          

          m.rotateY(time);
          m.scale(.6);
	  PT.render(renderList, m, [10,0,10]);
       m.restore();

    m.restore();
  };
};

let msg = 'These are\nsome Metaroom\nobjects.';
let PT = new CG.ParticlesText(msg);
let A = PT.layout(null, .5,.5), B = [], C = [];

document.addEventListener("keydown", (event) => {
   if ((37 <= event.keyCode <= 97) && (keyboardInput.keyWentUp(event.keyCode))) {
     msg += event.key;
   }
    console.log(msg);
    PT = new CG.ParticlesText(msg);
 });

for (let n = 0 ; n < msg.length ; n++) {
   let theta = Math.PI - 2 * Math.PI * n / msg.length;
   B[n] = [10 * Math.cos(theta), 5 * Math.sin(theta), 0];
   C[n] = B[n].slice();
}

export let demoText = new DemoText();