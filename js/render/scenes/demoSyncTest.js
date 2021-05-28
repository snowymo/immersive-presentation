import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";
import * as keyboardInput from "../../util/input_keyboard.js";
let posY = 1.5;
document.addEventListener("keydown", (event) => {
    if (keyboardInput.keyIsDown(keyboardInput.KEY_SPACE)) {
        posY += 0.01;
    }
  });

let DemoSyncTest = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;
  this.display = () => {
    
     m.save();
        m.translate(0, posY, 0);
        renderList.mCube().size(0.2).turnY(time).color([1,0,0]);
     m.restore();
  };
};

export let demoSyncTest = new DemoSyncTest();
