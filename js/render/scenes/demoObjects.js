import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

let DemoObjects = function () {
  this.background = "../../media/gltf/garage/garage.gltf";
  this.loadGLTF = false;

  this.display = () => {
    m.save();
    m.translate(0, 1, -0.4);
    m.scale(0.04);
    renderList.mCube().move(-4.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mQuad().move(-1.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mSquare().move(1.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mSphere().move(4.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mCylinder().move(-4.5, 1.5, 0).turnY(time).color([1, 1, 1]);
    renderList
      .mRoundedCylinder()
      .move(-1.5, 1.5, 0)
      .turnY(time)
      .color([1, 1, 1]);
    renderList.mTorus().move(1.5, 1.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mDisk().move(4.5, 1.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mCone().move(-4.5, -1.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mTube().move(-1.5, -1.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mTube3().move(1.5, -1.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mGluedCylinder().move(4.5, -1.5, 0).turnY(time).color([1, 1, 1]);
    m.restore();
  };
};

export let demoObjects = new DemoObjects();