import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";
import { CG } from "../core/CG.js";

let DemoPrajval = function () {
  this.background = null;
  this.loadGLTF = false;
  this.envInd = null;
  this.display = () => {
     m.save();
        m.translate(0, 1.5 + 0.5 * Math.sin(3 * time), 0);
        m.rotateY(time);
        m.scale(0.5);

        // Clock
        renderList.mCylinder().size(0.3,0.3,0.1).color([0,0,0]);
        renderList.mTorus().size(0.22).color([0.78,0.78,0.77]);
        renderList.mSphere().size(0.1).move(0.1,0.3,0).color([0.78,0.78,0.77]);
        renderList.mSphere().size(0.1).move(-0.1,0.3,0).color([0.78,0.78,0.77]);

        // 2 Legs of the clock
        renderList.mCylinder().size(0.06).turnX(Math.PI/2).turnY(Math.PI/4)
                  .move(0.18,-0.28,0).color([0,0,0]);
        renderList.mCylinder().size(0.06).turnX(Math.PI/2).turnY(-Math.PI/4)
          .move(-0.18,-0.28,0).color([0,0,0]);

        let date = new Date();
        let msg = ' Time \n' +
              (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
             (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
        let PT = new CG.ParticlesText(msg);
        m.save();
            m.translate(0,0,0.12);
            m.scale(0.08);
            PT.render(renderList, m, [10,10,10]);
        m.restore();
        m.save();
            m.translate(0,0,-0.12);
            m.scale(0.08);
            PT.render(renderList, m, [10,10,10]);
        m.restore();

     m.restore();
  };
};

export let demoPrajval = new DemoPrajval();
