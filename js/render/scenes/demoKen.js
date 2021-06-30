import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

let DemoKen = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;
  this.display = () => {
     m.save();
        m.translate(0, 1.5 + 0.5 * Math.sin(3 * time), 0);
        renderList.mCube().size(0.2).turnY(time).color(window.isSlideShow ? [1,1,0] : [0,1,0]);
     m.restore();
  };
};

export let demoKen = new DemoKen();
