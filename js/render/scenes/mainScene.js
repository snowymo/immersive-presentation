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

import { demoKen } from "./demoKen.js";
import { demoMocap } from "./demoMocap.js";
import { demoObjects } from "./demoObjects.js";
import { demoParticles } from "./demoParticles.js";
import { demoNoiseGrid } from "./demoNoiseGrid.js";
import { demoIan } from "./demoIan.js";

let loadGLTF = false;

const FEET_TO_METERS = 0.3048;

export let mainScene = () => {
  // for (let i in window.scene.childern) {
  //     if (window.scene.childern[i].name == "backGround") {
  //         window.scene.removeNode(i);
  //     }
  // }
  if (!loadGLTF) {
    window.scene.addNode(
      new Gltf2Node({ url: "../../media/gltf/garage/garage.gltf" })
    ).name = "backGround";
    loadGLTF = true;
  }

  m.save();
  // add the procedural objects you wish to have all the time here
  m.restore();

  if (demoKenState % 3) demoKen(demoKenState % 3);

  if (demoMocapState % 2) demoMocap();

  if (demoObjectsState % 2) demoObjects();

  if (demoParticlesState % 2) demoParticles();

  if (demoNoiseGridState % 2) demoNoiseGrid();

  if (demoIanState % 2) demoIan();

};

addDemoButtons('Ken,Mocap,NoiseGrid,Objects,Particles,Speak,Ian');
