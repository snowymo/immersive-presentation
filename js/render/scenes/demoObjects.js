import { m, renderList } from "../core/renderList.js";
import { CG } from "../core/CG.js";
import { time } from "../core/renderListScene.js";

let DemoObjects = function () {
  this.background = "../../media/gltf/home-theater/home-theater.gltf";
  this.loadGLTF = false;
  this.envInd = null;

  let P = CG.particlesCreateMesh(10000);

  this.display = () => {
    m.save();
    m.translate(0, 1, -0.4);
    m.scale(0.04);
    renderList.mCube().move(-4.5, 4.5, 0).turnY(time).color([1, 1, 1]).setBaseTexture("brick.png");
    renderList.mQuad().move(-1.5, 4.5, 0).turnY(time).color([1, 1, 1]).setBaseTexture("stones.jpg");;
    renderList.mSquare().move(1.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    renderList.mSphere().move(4.5, 4.5, 0).turnY(time).color([1, 1, 1]);
    // renderList.mCylinder().move(-4.5, 1.5, 0).turnY(time).color([1, 1, 1]).textureView(window.textures[3].lookupImageByID(1)).textureAtlas(window.textures[3]);
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
    m.save();
       CG.particlesTextMessage(P, '  These are\nsome Metaroom\n   objects');
       m.translate(0,0,3);
       m.rotateY(Math.sin(2 * time));
       m.scale(.3,.6,.6);
       m.translate(-5,4,0);
       renderList.mMesh(P).color([10, 10, 0])
                          .textureView(window.textures[4].lookupImageByID(1))
		          .textureAtlas(window.textures[4]);
    m.restore();


    m.restore();
  };
};

export let demoObjects = new DemoObjects();
