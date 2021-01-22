
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";

export let kenDemo = time => {
    m.save();
       m.translate(0,1.5 + .5 * Math.sin(3 * time),-1);
       if (Math.floor(time) % 10 < 5)
          renderList.mCube().size(.2).turnY(time).color([0,1,0]);
       else
          renderList.mCylinder().size(.2).turnY(time).color([1,0,0]);
    m.restore();
}

