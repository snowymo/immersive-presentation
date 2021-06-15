import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { time, viewMatrix } from "../core/renderListScene.js";
import { airfont } from "../core/airfont.js";
import "../../third-party/corelink.browser.lib.js";

// expected dimensions of the incoming data texture
// TODO: perhaps we could infer this from the first frame of data?
const pixelWidth = 640;
const pixelHeight = 480;
let P = CG.particlesCreateMesh(10000);
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
        const realWidth = 6.4;
        const realHeight = 4.8;
        let R = [];
        for (let i = 0; i < dataPoints.length; i++) {
          let idx = dataPoints[i][0];
          let d = dataPoints[i][1];
          let c = dataPoints[i][2];
          let rx = (idx % pixelWidth) / pixelWidth * realWidth;
          let ry = (1 - Math.floor(idx / pixelWidth) / pixelHeight) * realHeight;
          let rz = d / 100;
          let rrad = 0.007 * realWidth;
          // TODO: color
          let baseR = 0.3;
          let baseG = 0.8;
          let baseB = 1.2;
          // faking scanlines
          if (Math.abs(ry - time / 2) % 1.5 < 0.1) {
            baseR = 1.0;
            baseG = 1.2;
            baseB = 1.6;
          }
          let rr = baseR * c / 256;
          let rg = baseG * c / 256;
          let rb = baseB * c / 256;

          R.push([rx, ry, rz, rrad, rr, rg, rb]);
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
