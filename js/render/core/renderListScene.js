"use strict";
import { mainScene } from "../scenes/mainScene.js";
import { corelink_event } from "../../util/corelink_sender.js";

export let ids = [];
export let leftHandState = "released", rightHandState = "released";
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
      // allow local owner to react to the buttons
      if (b[i].pressed && !buttonState[h][i]) onPress(h, i);
      else
        if (b[i].pressed && buttonState[h][i]) onDrag(h, i);
        else
          if (!b[i].pressed && buttonState[h][i]) onRelease(h, i);

      // Update
      buttonState[h][i] = b[i].pressed;
    }
  }
};

export let onPress = (hand, button, id) => {

  window.isPressed = true;
  window.isReleased = false;
  window.isDragged = false;
  console.log("onPress", hand, "button", button,
    window.isPressed, window.isReleased, window.isDragged);
  //ZH
  // console.log("handleSelect");
  // corelink_event({ it: "lefttrigger", op: "press" });
  updateIdState(id, hand, "pressed");
  if (hand === "left") leftHandState = "pressed";
  else if (hand === "right") rightHandState = "pressed";
};

export let onDrag = (hand, button, id) => {
  // console.log("onDrag", hand, "button", button, isPressed, isReleased, isDragged);
  if (window.isPressed && window.justReleased) {
    window.isDragged = true;
    window.isReleased = false;
    window.isPressed = false;
    
    updateIdState(id, hand, "dragged");
    if (hand === "left") leftHandState = "dragged";
    else if (hand === "right") rightHandState = "dragged";
  }
};

export let onRelease = (hand, button, id) => {
  if (window.isDragged) {
    window.isReleased = true;
    window.isPressed = false;
    window.isDragged = false;
    console.log("onRelease", hand, "button", button,
      window.isPressed, window.isReleased, window.isDragged);

    updateIdState(id, hand, "released");
    if (hand === "left") leftHandState = "released";
    else if (hand === "right") rightHandState = "released";
  }

  //ZH
  // console.log("handleSelect");
  // corelink_event({ it: "lefttrigger", op: "release" });
};

export let getViews = (views) => {
  viewMatrix = [];
  for (let view of views) viewMatrix.push(view.viewMatrix);
};

export let updateIdList = (id) => {
  if (!ids.includes(id)) {
    if (ids[0] === undefined) ids[0] = {id: id, lState: "released", rState: "released"};
    else ids.push({id: id, lState: "released", rState: "released"});
  }
}

let updateIdState = (id, hand, state) => {
  for (let i=0; i<ids.length; i++) {
    if (ids[i].id === id) {
      if (hand === "left") ids[i].lState = state;
      else if (hand === "right") ids[i].rState = state;
    }
  }
}

export function renderListScene(_time) {
  time = _time;
  mainScene();
}

