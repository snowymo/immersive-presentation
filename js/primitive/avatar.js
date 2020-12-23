'use strict';

import { Gltf2Node } from '../render/nodes/gltf2.js';
import { mat4, vec3 } from '../render/math/gl-matrix.js';

export function initAvatar(id) {
  let headset = new Headset();
  let leftController = new Controller("left");
  let rightController = new Controller("right");
  // setup render nodes for new avatar
  headset.model.name = "headset" + id;
  window.scene.addNode(headset.model);
  leftController.model.name = "LC" + id;
  window.scene.addNode(leftController.model);
  rightController.model.name = "RC" + id;
  window.scene.addNode(rightController.model);
  let avatar = new Avatar(headset, id, leftController, rightController);
  window.avatars[id] = avatar;
}

export class Avatar {
  constructor(head, id, leftController, rightController) {
    this.playerid = id;
    this.headset = head;
    this.leftController = leftController;
    this.rightController = rightController;
    //TODO: Do we really want this to be the default?
    // this.mode = MR.UserType.browser; 
    // webrtc
    this.roomID = "chalktalk";
    this.localUuid = this.createUUID();
    this.localStream = null;

    this.audioContext = null;
  }

  // Taken from http://stackoverflow.com/a/105074/515584
  // Strictly speaking, it's not a real UUID, but it gets the job done here
  createUUID() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}

export class Headset {
  constructor(verts) {
    // this.vertices = verts;
    this.position = vec3.fromValues(0, 0, 0);
    this.orientation = [0, 0, 0, 1];
    this.matrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.model = new Gltf2Node({ url: '../../media/gltf/headset/headset.gltf' });
    this.model.scale = vec3.fromValues(1, 1, 1);
    this.model.name = "headset";
    this.model.visible = false;
  }
}

export class Controller {
  constructor(handedness) {
    // this.vertices = verts;
    this.position = vec3.fromValues(0, 0, 0);
    this.orientation = [0, 0, 0, 1];
    // this.analog = new Button();
    // this.trigger = new Button();
    // this.side = new Button();
    // this.x = new Button();
    // this.y = new Button();
    if (handedness == "left") {
      this.model = new Gltf2Node({ url: '../../media/gltf/controller/controller-left.gltf' });
    }
    else {
      this.model = new Gltf2Node({ url: '../../media/gltf/controller/controller.gltf' });
    }
    this.matrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.model.scale = vec3.fromValues(1, 1, 1);
    this.model.name = "ctrl";
    this.model.visible = false;
  }
}

export class Button {
  //buttons have a 'pressed' variable that is a boolean.
  /*A quick mapping of the buttons:
    0: analog stick
    1: trigger
    2: side trigger
    3: x button
    4: y button
    5: home button
  */
  constructor() {
    this.pressed = false;
  }
}
