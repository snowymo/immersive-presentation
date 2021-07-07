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

import { demoText } from "./demoText.js";
import { demoAirText } from "./demoAirText.js";
import { demoBill } from "./demoBill.js";
import { demoChris } from "./demoChris.js";
import { demoHands } from "./demoHands.js";
import { demoKen } from "./demoKen.js";
import { demoMocap } from "./demoMocap.js";
import { demoNoiseGrid } from "./demoNoiseGrid.js";
import { demoObjects } from "./demoObjects.js";
import { demoParticles } from "./demoParticles.js";
import { demoPrajval } from "./demoPrajval.js";
import { demoPlanets } from "./demoPlanets.js";
import { demoRohail } from "./demoRohail.js";
import { demoSyncTest } from "./demoSyncTest.js";
import { demoDraw } from "./demoDraw.js";

let loadGLTF = false;
let curDemoEnv = [];
let defaultBackground = "./media/gltf/60_fifth_ave/60_fifth_ave.gltf";
//let tableUrl = "./media/gltf/table/Table.gltf"

const FEET_TO_METERS = 0.3048;

export let mainScene = () => {
  if (!loadGLTF) {
    window.scene.addNode(new Gltf2Node({ url: defaultBackground })).name =
      "backGround";
    loadGLTF = true;
  }
  //window.scene.addNode(new Gltf2Node({ url: tableUrl}));
  showNameTag();

  // add the procedural objects you wish to have all the time here
  m.save();
  renderList.mCylinder().move(0, .74, 0).turnX(Math.PI / 2).size(.8, .8, .01).color([.25, .15, .05]);
  renderList.mCylinder().move(0, .37, 0).turnX(Math.PI / 2).size(.07, .07, .37).color([.25, .15, .05]);
  renderList.mCylinder().move(0, .005, 0).turnX(Math.PI / 2).size(.25, .25, .005).color([.25, .15, .05]);
  m.restore();

  if (demoAirTextState % 2) loadScene(demoAirText); else stopScene(demoAirText);
  if (demoBillState % 2) loadScene(demoBill); else stopScene(demoBill);
  if (demoChrisState % 2) loadScene(demoChris); else stopScene(demoChris);
  if (demoHandsState % 2) loadScene(demoHands); else stopScene(demoHands);
  if (demoKenState % 2) loadScene(demoKen); else stopScene(demoKen);
  if (demoMocapState % 2) loadScene(demoMocap); else stopScene(demoMocap);
  if (demoNoiseGridState % 2) loadScene(demoNoiseGrid); else stopScene(demoNoiseGrid);
  if (demoObjectsState % 2) loadScene(demoObjects); else stopScene(demoObjects);
  if (demoParticlesState % 2) loadScene(demoParticles); else stopScene(demoParticles);
  if (demoPrajvalState % 2) loadScene(demoPrajval); else stopScene(demoPrajval);
  if (demoPlanetsState % 2) loadScene(demoPlanets); else stopScene(demoPlanets);
  if (demoRohailState % 2) loadScene(demoRohail); else stopScene(demoRohail);
  if (demoTextState % 2) loadScene(demoText); else stopScene(demoText);
  if (demoSyncTestState % 2) loadScene(demoSyncTest); else stopScene(demoSyncTest);
  if (demoDrawState % 2) loadScene(demoDraw); else stopScene(demoDraw);
};

function loadScene(demo) {
  if (demo.background && demo.envInd == null) {
    switchBackground(demo.background);
    demo.loadGLTF = true;
    curDemoEnv.push(demo);
    demo.envInd = curDemoEnv.length - 1;
  }
  demo.display();
}

function stopScene(demo) {
  // it is the curretly displayed scene
  if (demo.loadGLTF) {
    // if there is a back-up
    if (curDemoEnv.length > 1 && curDemoEnv[curDemoEnv.length - 2].background) {
      switchBackground(curDemoEnv[curDemoEnv.length - 2].background);
      curDemoEnv[curDemoEnv.length - 2].loadGLTF = true;
    }
    else switchBackground(defaultBackground);
    for (let i = demo.envInd + 1; i < curDemoEnv.length; i++) {
      curDemoEnv[i].envInd--;
    }
    curDemoEnv.splice(demo.envInd, 1);
    demo.envInd = null;
  } else if (demo.envInd != null) { // it has been added to the gltf env list but not active
    curDemoEnv.splice(demo.envInd, 1);
    demo.envInd = null;
  }
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
  // it overwrites the latest gltf env in the demo list
  if (curDemoEnv.length > 0) curDemoEnv[curDemoEnv.length - 1].loadGLTF = false;
  window.scene.addNode(new Gltf2Node({ url: background })).name = "backGround";
}

function showNameTag() {
  for (let key in window.avatars) {
    if (window.playerid && window.playerid != window.avatars[key].playerid && window.avatars[key].headset.matrix[0] != undefined) {
      m.save();
      let msg = window.avatars[key].name;
      let PT = new CG.ParticlesText(msg);
      PT.layout(null, .5, .5);
      // let mat = Array.from(window.avatars[key].headset.matrix);
      let mat = [];
      for (let i = 0; i < 16; i++) {
        mat.push(window.avatars[key].headset.matrix[i])
      }
      m.set(mat);

      m.save();
      m.rotateY(Math.PI);
      m.translate(0, 0.15, 0.1);
      m.scale(0.05);
      // renderList.mMesh(PT.mesh()).color(window.avatars[key].nameTagColor).setBaseTexture('font.png');
      PT.render(renderList, m, window.avatars[key].nameTagColor);
      m.restore();
      m.restore();
    }


  }
}

window.demoNames = "AirText,Bill,Chris,Hands,Ken,Mocap,NoiseGrid,Objects,Particles,Prajval,Planets,Rohail,Speak,Text,SyncTest,Draw";
addDemoButtons(window.demoNames);
window.addNameField();
