import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoTemplate = function () {
   this.background = null; // change this to the relative path of your gltf model if you wish to customize the background environment for your demo
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => { // add your demo content here!
      m.save(); // m is a matrix stack to maintain the hierarchy of transformation
      m.translate(0,1.5,0); // this moves everything below 1.5 units higher
      m.scale(0.1); // this scales everything below to 0.1 of their original size
      renderList.mCube().turnY(time).color([1, 1, 1]).setBaseTexture("brick.png");
      m.restore();
   };
};

export let demoTemplate = new DemoTemplate();
