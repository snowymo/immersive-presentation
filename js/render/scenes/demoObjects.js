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

    renderList.mCube().move(-4.5, 4.5, 0)
                      .turnY(time).color([1, 1, 1])
                      .setBaseTexture("brick.png");
    renderList.mQuad().move(-1.5, 4.5, 0)
                      .turnY(time).color([1, 1, 1])
                      .setBaseTexture("stones.jpg");;
    renderList.mSquare().move(1.5, 4.5, 0)
                        .turnY(time).color([1, 1, 1])
                        .setBaseTexture("font.png");
    renderList.mSphere().move(4.5, 4.5, 0)
                        .turnY(time).color([1, 1, 1]);
    renderList.mCylinder().move(-4.5, 1.5, 0)
                          .turnY(time).color([1, 1, 1])
			  .textureView(window.textures[1].lookupImageByID(1))
			  .textureAtlas(window.textures[1]);
    renderList.mRoundedCylinder().move(-1.5, 1.5, 0)
                                 .turnY(time)
                                 .color([1, 1, 1])
				 .textureView(window.textures[2].lookupImageByID(1))
				 .textureAtlas(window.textures[2]);
    renderList.mTorus().move(1.5, 1.5, 0)
                       .turnY(time).color([1, 1, 1]);
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

    let mix = (a,b,t) => a + t * (b - a);

    m.save();
       let t = Math.max(0, Math.min(1, .5 + Math.sin(time)));

       let A = PT.layout();
       for (let n = 0 ; n < msg.length ; n++) {
          let theta = Math.PI - 2 * Math.PI * n / msg.length;
	  A[n] = CG.mix(A[n], [10 * Math.cos(theta), 5 * Math.sin(theta), 0], t);
       }
       PT.layout(A);

       m.translate(0,0,3);
       m.rotateY(Math.sin(2 * time));
       m.scale(.3,.6,.6);
       m.translate(mix(-5,1,t),mix(4,3,t),0);
       renderList.mMesh(PT.mesh()).color([10, 10, 0])
                                  .setBaseTexture('font.png');
    m.restore();

    m.restore();
  };
};

let msg = '  These are\nsome Metaroom\n   objects';
let PT = new CG.ParticlesText(msg);

export let demoObjects = new DemoObjects();
