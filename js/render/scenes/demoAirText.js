
import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { time, viewMatrix } from "../core/renderListScene.js";
import { airfont } from "../core/airfont.js";

let msg = 'Future Reality Lab\n    Metaroom', P;
{
   let total = 0;
   for (let i = 0; i < msg.length; i++)
      total += airfont.strokeLength(msg.substring(i, i + 1));
   P = CG.particlesCreateMesh(Math.floor(70 * total));
}

let DemoAirText = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
      let mix = (a, b, t) => a + t * (b - a);
      let R = [], x = 0, y = 3;
      let t = .5 + .5 * Math.cos(time / 3);
      CG.random(0);
      for (let i = 0; i < msg.length; i++) {
         let ch = msg.substring(i, i + 1);
         if (ch == '`') {
            let j = msg.indexOf('`', i + 1);
            if (j >= 0) {
               if (j > i + 1)
                  ch = msg.substring(i + 1, j);
               i = j;
            }
         }
         let ns = 50 * airfont.strokeLength(ch);
         for (let n = 0; n < ns; n++) {
            let xy = airfont.eval(n / ns, ch),
                theta = 1000 * n / ns + time / 2 * (n % 2 ? 1 : -1),
                rx = CG.random() + .3 * Math.cos(theta),
	        ry = CG.random() + .3 * Math.sin(theta),
		rz = CG.random();
            R.push([mix(0.5 * x + xy[0], 1 + 6 * rx, t),     // x
                    mix(1.5 * y + xy[1], 2.4 + 1.5 * ry, t), // y
                    mix(0, 6 * rz - 1.5, t),                 // z
		    .03,                                     // radius
                    i / msg.length,                          // red
		    CG.random(),                             // green
		    1 - i / msg.length]);                    // blue
         }
         x++;
         if (ch == '\n') {
            x = 0;
            y--;
         }
      }
      CG.particlesSetPositions(P, R, CG.matrixMultiply(viewMatrix[0], m.value()));
      m.save();
         m.translate(-.5, 1, -.1);
         renderList.mMesh(P).size(.1).color([10, 10, 10]);
      m.restore();
   }
}

export let demoAirText = new DemoAirText();

