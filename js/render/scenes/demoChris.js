import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

let DemoChris = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;
  this.display = () => {
     m.save();
        m.translate(0, 1.5 + 0.5 * Math.sin(3 * time), 0);
        if (Math.floor(time) % 10 < 5)
           renderList.mCube().size(0.2).turnY(time).color([0, 0, 1]);
        else
           renderList.mCylinder().size(0.2).turnY(time).color([1, 1, 0]);
     m.restore();
  };
};

export let demoChris = new DemoChris();
