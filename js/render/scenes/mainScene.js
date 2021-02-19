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

import { demoAirText   } from "./demoAirText.js";
import { demoKen       } from "./demoKen.js";
import { demoMocap     } from "./demoMocap.js";
import { demoObjects   } from "./demoObjects.js";
import { demoParticles } from "./demoParticles.js";
import { demoNoiseGrid } from "./demoNoiseGrid.js";

let loadGLTF = false;

const FEET_TO_METERS = 0.3048;

export let mainScene = () => {
  // for (let i in window.scene.childern) {
  //     if (window.scene.childern[i].name == "backGround") {
  //         window.scene.removeNode(i);
  //     }
  // }
  // ../../media/gltf/classroom/classroom0126.gltf
  // 
  if (!loadGLTF) {
    window.scene.addNode(
      new Gltf2Node({ url: "../../media/gltf/Futuristic_Lab_Mockup_03/Futuristic_Lab_Mockup.gltf" })
    ).name = "backGround";
    loadGLTF = true;
  }

  m.save();
  // add the procedural objects you wish to have all the time here
  m.restore();

  if (demoAirTextState   % 2) demoAirText();
  if (demoKenState       % 2) demoKen();
  if (demoMocapState     % 2) demoMocap();
  if (demoObjectsState   % 2) demoObjects();
  if (demoParticlesState % 2) demoParticles();
  if (demoNoiseGridState % 2) demoNoiseGrid();
};

addDemoButtons('AirText,Ken,Mocap,NoiseGrid,Objects,Particles,Speak');
