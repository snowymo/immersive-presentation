import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

let DemoObjects = function () {
  this.background = "../../media/gltf/home-theater/home-theater.gltf";
  this.loadGLTF = false;
  this.envInd = null;

  this.display = () => {
    m.save();
    m.translate(0, 1, -0.4);
    m.scale(0.04);
    renderList.mCube().move(-4.5, 4.5, 0)
                      .turnY(time).color([1, 1, 1])
		      .textureView(window.textures[1].lookupImageByID(1))
		      .textureAtlas(window.textures[1])
		      .textureAtlas(window.textures[2]);
    renderList.mQuad().move(-1.5, 4.5, 0)
                      .turnY(time).color([1, 1, 1]);
    renderList.mSquare().move(1.5, 4.5, 0)
                        .turnY(time).color([1, 1, 1])
			.color(10,0,0)
			.textureView(window.textures[6].lookupImageByID(1))
			.textureAtlas(window.textures[6]);
    renderList.mSphere().move(4.5, 4.5, 0)
                        .turnY(time).color([1, 1, 1]);
    renderList.mCylinder().move(-4.5, 1.5, 0)
                          .turnY(time).color([1, 1, 1])
			  .textureView(window.textures[3].lookupImageByID(1))
			  .textureAtlas(window.textures[3]);
    renderList.mRoundedCylinder().move(-1.5, 1.5, 0)
                                 .turnY(time)
                                 .color([1, 1, 1])
				 .textureView(window.textures[4].lookupImageByID(1))
				 .textureAtlas(window.textures[4]);
    renderList.mTorus().move(1.5, 1.5, 0)
                       .turnY(time).color([1, 1, 1])
		       .textureView(window.textures[0].lookupImageByID(1))
		       .textureAtlas(window.textures[0]);
    renderList.mDisk().move(4.5, 1.5, 0)
                      .turnY(time).color([1, 1, 1]);
    renderList.mCone().move(-4.5, -1.5, 0)
                      .turnY(time).color([1, 1, 1]);
    renderList.mTube().move(-1.5, -1.5, 0)
                      .turnY(time).color([1, 1, 1]);
    renderList.mTube3().move(1.5, -1.5, 0)
                      .turnY(time).color([1, 1, 1]);
    renderList.mGluedCylinder().move(4.5, -1.5, 0)
                               .turnY(time)
			       .color([1, 1, 1]);
    m.restore();
  };
};

export let demoObjects = new DemoObjects();
