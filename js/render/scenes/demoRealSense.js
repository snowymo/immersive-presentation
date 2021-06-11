import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { time, viewMatrix } from "../core/renderListScene.js";
import { airfont } from "../core/airfont.js";
import "../../third-party/corelink.browser.lib.js";

// expected dimensions of the incoming data texture
// TODO: perhaps we could infer this from the first frame of data?
const pixelWidth = 64;
const pixelHeight = 48;
let P = CG.particlesCreateMesh(pixelWidth * pixelHeight);
let dataPoints = [];

let DemoRealSense = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
      if (window.pointCloudData) {
        dataPoints = window.pointCloudData;
      }
      if (dataPoints.length > 0) {
        // dimensions of the space the points occupy
        let realWidth = 3.2;
        let realHeight = 2.4;
        let R = [];
        for (let j = 0; j < dataPoints.length; j++) {
            let row = dataPoints[j];
            for (let i = 0; i < row.length; i++) {
                let rx = i * realWidth / pixelWidth;
                let ry = realHeight - j * realHeight / pixelHeight;
                let rz = row[i] / 1000;
                let rrad = 0.1 / realWidth;
                // TODO: color
                let rr = rz;
                let rg = 1;
                let rb = 1;
                R.push([rx, ry, rz, rrad, rr, rg, rb]);
            }
        }
        CG.particlesSetPositions(P, R, CG.matrixMultiply(viewMatrix[0], m.value()));
        m.save();
            m.translate(0, 1.3, 0);
            renderList.mMesh(P).size(.1).color([10, 10, 10]);
        m.restore();
      }
   }
}

export let demoRealSense = new DemoRealSense();
