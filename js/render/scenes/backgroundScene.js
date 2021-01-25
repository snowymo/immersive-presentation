"use strict";
import { Gltf2Node } from "../nodes/gltf2.js";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList, mList, mBeginBuild, mEndBuild } from "../core/renderList.js";

let loadGLTF = false;

export let backgroundScene = (time) => {
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

}