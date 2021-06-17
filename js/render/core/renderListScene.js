"use strict";
import { mainScene } from "../scenes/mainScene.js";
import { corelink_event } from "../../util/corelink_sender.js";

export let viewMatrix = [], time = 0;
window.isPressed = false;
window.isDragged = false;
window.isReleased = true;

export let controllerMatrix = { left: [], right: [] };
export let buttonState = { left: [], right: [] };
for (let i = 0; i < 7; i++) buttonState.left[i] = buttonState.right[i] = false;

const validHandedness = ["left", "right"];
window.initxr = false;

export let updateController = (avatar, buttonInfo) => {
  controllerMatrix.left = avatar.leftController.matrix;
  controllerMatrix.right = avatar.rightController.matrix;

  if (validHandedness.includes(buttonInfo.handedness)) {
    const h = buttonInfo.handedness;
    const b = buttonInfo.buttons;

    for (let i = 0; i < 7; i++) {
      // if (b[i].pressed && !buttonState[h][i]) onPress(h, i);
      // else
      //   if (b[i].pressed && buttonState[h][i]) onDrag(h, i);
      //   else
      //     if (!b[i].pressed && buttonState[h][i]) onRelease(h, i);

      // Update
      buttonState[h][i] = b[i].pressed;
    }
  }
};

export let onPress = (hand, button) => {

  window.isPressed = true;
  window.isReleased = false;
  window.isDragged = false;
  console.log("onPress", hand, "button", button,
    window.isPressed, window.isReleased, window.isDragged);
  //ZH
  // console.log("handleSelect");
  // corelink_event({ it: "lefttrigger", op: "press" });
};

export let onDrag = (hand, button) => {
  // console.log("onDrag", hand, "button", button, isPressed, isReleased, isDragged);
  if (window.isPressed && window.justReleased) {
    window.isDragged = true;
    window.isReleased = false;
    window.isPressed = false;
  }
};

export let onRelease = (hand, button) => {
  if (window.isDragged) {
    window.isReleased = true;
    window.isPressed = false;
    window.isDragged = false;
    console.log("onRelease", hand, "button", button,
      window.isPressed, window.isReleased, window.isDragged);
  }

  //ZH
  // console.log("handleSelect");
  // corelink_event({ it: "lefttrigger", op: "release" });
};

export let getViews = (views) => {
  viewMatrix = [];
  for (let view of views) viewMatrix.push(view.viewMatrix);
};

export function renderListScene(_time) {
  time = _time;
  mainScene();
}

