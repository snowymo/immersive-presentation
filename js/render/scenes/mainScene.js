"use strict";
import { Gltf2Node } from "../nodes/gltf2.js";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import {
  m,
  renderList,
  mList,
  mBeginBuild,
  mEndBuild,
} from "../core/renderList.js";
import {
  time,
  viewMatrix,
  controllerMatrix,
  buttonState,
} from "../core/renderListScene.js";

import { rokokoData } from "../../data/RokokoData.js";

import { demoAirText } from "./demoAirText.js";
import { demoKen } from "./demoKen.js";
import { demoMocap } from "./demoMocap.js";
import { demoObjects } from "./demoObjects.js";
import { demoParticles } from "./demoParticles.js";
import { demoNoiseGrid } from "./demoNoiseGrid.js";

let loadGLTF = false;
let curDemoEnv = null;
let envList = [];
let defaultBackground =
  "../../media/gltf/Futuristic_Lab_Mockup_03/Futuristic_Lab_Mockup.gltf";

const FEET_TO_METERS = 0.3048;

export let mainScene = () => {
  if (!loadGLTF) {
    window.scene.addNode(new Gltf2Node({ url: defaultBackground })).name =
      "backGround";
    loadGLTF = true;
  }

  m.save();
  // add the procedural objects you wish to have all the time here
  m.restore();
  if (demoAirTextState % 2) loadScene(demoAirText);
  if (demoKenState % 2) loadScene(demoKen);
  if (demoMocapState % 2) loadScene(demoMocap);
  if (demoObjectsState % 2) loadScene(demoObjects);
  if (demoParticlesState % 2) loadScene(demoParticles);
  if (demoNoiseGridState % 2) loadScene(demoNoiseGrid);
};

function loadScene(demo) {
  if (demo.background && !demo.loadGLTF){
    switchBackground(demo.background);
    demo.loadGLTF = true;
    curDemoEnv = demo;
  } 
  demo.display();
}

// function switchScene(cur_demo) {
//   // switch background
//   if(curDemoEnv && curDemoEnv.loadGLTF) {
//     if(!cur_demo || !cur_demo.background){
//       switchBackground(defaultBackground);
//     } else {
//       switchBackground(cur_demo.background);
//       cur_demo.loadGLTF = true;
//     }
//     curDemoEnv.loadGLTF = false;
//   }
//   // play the new loaded scene
//   if(cur_demo) loadScene(cur_demo);
// }

function switchBackground(background) {
  for (let i in window.scene.children) {
    if (window.scene.children[i].name == "backGround") {
      window.scene.children.splice(i, 1);
      break;
    }
  }
  if(curDemoEnv) curDemoEnv.loadGLTF = false;
  window.scene.addNode(new Gltf2Node({ url: background })).name =
    "backGround";
}

addDemoButtons(
  "AirText,Ken,Mocap,NoiseGrid,Objects,Particles,Speak"
);
