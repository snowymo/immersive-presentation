
import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

export let demoKen = () => {
    m.save();
       m.translate(0,1.5 + .5 * Math.sin(3 * time),-1);
       if (Math.floor(time) % 10 < 5)
          renderList.mCube().size(.2).turnY(time).color([0,1,0]);
       else
          renderList.mCylinder().size(.2).turnY(time).color([1,0,0]);
    m.restore();
}

