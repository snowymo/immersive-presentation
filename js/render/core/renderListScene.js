"use strict";
import { mainScene } from "../scenes/mainScene.js";
import { corelink_event } from "../../util/corelink_sender.js";

export let viewMatrix = [], time = 0, isPressed = false, isDragged = false, isReleased = true;

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
      if (b[i].pressed && !buttonState[h][i]) onPress(h, i);
      else if (b[i].pressed && buttonState[h][i]) onDrag(h, i);
      else if (!b[i].pressed && buttonState[h][i]) onRelease(h, i);

      // Update
      buttonState[h][i] = b[i].pressed;
    }
  }
};

export let onPress = (hand, button) => {
  console.log("pressed", hand, "button", button);
  isPressed = true;
  isReleased = false;
  isDragged = false;
  //ZH
  // console.log("handleSelect");
  // corelink_event({ it: "lefttrigger", op: "press" });
};

export let onDrag = (hand, button) => {
  isDragged = true;
  isReleased = false;
  isPressed = false;
};

export let onRelease = (hand, button) => {
  console.log("released", hand, "button", button);
  isReleased = true;
  isPressed = false;
  isDragged = false;
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

