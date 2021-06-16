import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";
import * as keyboardInput from "../../util/input_keyboard.js";

// import { corelink_message } from "../../util/corelink_sender.js";
// import { metaroomEventSender } from "../../corelink_handler.js"

window.posY = 1.5;

import {
  viewMatrix,
  controllerMatrix,
  buttonState,
} from "../core/renderListScene.js";
document.addEventListener("keydown", (event) => {
  if (keyboardInput.keyIsDown(keyboardInput.KEY_SPACE)) {
    // To Keru: what we have to implement in the code is input handler, such as processing controller information
    // We can have a debug event like key press for easy development but the way how we handle input event is necessary.
    // sync to the server
    // var msg = corelink_message("event", { it: "lt", op: "press" });
    // corelink.send(metaroomEventSender, msg);


    window.posY += 0.01;
  }
});

let DemoSyncTest = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;
  this.display = () => {
    if (window.isPressed && buttonState.left[0]) {
      window.posY += 0.01;
    }
    m.save();
    m.translate(0, window.posY, 0);
    renderList.mCube().size(0.2).turnY(time).color([1, 0, 0]);
    m.restore();

  };
};

export let demoSyncTest = new DemoSyncTest();
