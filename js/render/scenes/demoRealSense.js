import { ImprovedNoise } from "../math/improvedNoise.js";
import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { time, viewMatrix } from "../core/renderListScene.js";
// import { realsenseData } from "../../data/realsensedata.js";
// import { realsenseData_R } from "../../data/realsensedata_r.js";
// import { realsenseData_L } from "../../data/realsensedata_l.js";
import { airfont } from "../core/airfont.js";
import "../../third-party/corelink.browser.lib.js";

// if true, this will read from "../../data/realsensedata.js"
// otherwise, we read from streamed data on the "realsense" channel
const READ_FROM_FILE = false;

// expected dimensions of the incoming data texture, note this is from the cropped image.
// TODO: perhaps we could infer this from the first frame of data?
// const pixelWidth = 1280;
// const pixelHeight = 720;
const pixelWidth = 768 / 2;
const pixelHeight = 432 / 2;

// number of particles
let P = {};

// these are used to position different avatars at different, fixed locations
let positionOffsets = {};
let rotationOffsets = {};
let curPosIdx = 0;
const availablePositions = [
  [-0.3, 1.0, -0.3],
  [0.1, 1.1, -0.4],
  [-0.5, 1.0, -0.7]
];
const availableRotations = [
  0,
  0.7854,
  -0.7854
];


let DemoRealSense = function () {
   this.background = null;
   this.loadGLTF = false;
   this.envInd = null;

   this.display = () => {
     let dataframe = {};
     if (READ_FROM_FILE) {
       // fake an offset of time when reading from the same file.
       // later on, we may use 3 different avatars.
        let frame_idx1 = Math.floor(15 * time) % realsenseData.length;
        let frame_idx2 = Math.floor(15 * time) % realsenseData.length;
        let frame_idx3 = Math.floor(15 * time) % realsenseData.length;
        dataframe["user1"] = realsenseData[frame_idx1];
        dataframe["user2"] = realsenseData[frame_idx2];
        dataframe["user3"] = realsenseData[frame_idx3];
     } else {
       // data from the realsense channel
       let rawdata = window.pointCloudData["Testuser1"];
       // console.log(rawdata);
       dataframe = {};
       dataframe["Testuser1"] = [];
       for (let i = 0; i < rawdata.length; i+=6) {
         dataframe["Testuser1"].push([
           rawdata[i  ],
           rawdata[i+1],
           rawdata[i+2],
           rawdata[i+3],
           rawdata[i+4],
           rawdata[i+5],
         ]);
       }
     }
      if (dataframe) {
        for (const username in dataframe) {
          if (!P[username]) {
            // create a new particle cloud & assign it an offset
            P[username] = CG.particlesCreateMesh(10000);
            positionOffsets[username] = availablePositions[curPosIdx];
            rotationOffsets[username] = availableRotations[curPosIdx];
            curPosIdx++;
          }
          let dataPoints = dataframe[username];
          if (dataPoints.length > 0) {
            // dimensions of the space the points occupy
            const realWidth = 6.4;
            const realHeight = 4.8;
            let R = [];
            let particleCount = 0;
            for (let i = 0; i < dataPoints.length; i++) {
              // idx is the index of the point in a 1D-resizing of the texture array
              // this tells us the coordinates of the point.
              let rx = dataPoints[i][0] / pixelWidth * realWidth;
              let ry = dataPoints[i][1] / pixelHeight * realHeight;

              // d is depth, r,g,b is color
              let d = dataPoints[i][2];
              let r = dataPoints[i][3];
              let g = dataPoints[i][4];
              let b = dataPoints[i][5];
              
              // base z position on depth, which is given in cm
              let rz = d / 100;
              // fixed size for particles
              let rrad = 0.006 * realWidth;

              let rr = r / 256;
              let rg = g / 256;
              let rb = b / 256;
	      if (Math.min(rr, rg, rb) < .6 && rz < 10) {
	         particleCount++;
                 R.push([rx, ry, rz, rrad, rr, rg, rb]);
              }
	      else
                 R.push([0,0,0,0,0,0,0]);
            }
	    let matrix = m.value();
	    matrix = CG.matrixMultiply( CG.matrixRotateY(rotationOffsets[username]) , matrix);
            CG.particlesSetPositions(P[username], R, CG.matrixMultiply(viewMatrix[0], matrix));
            m.save();
            // apply offsets to position different users in different spots
                m.translate(positionOffsets[username][0], positionOffsets[username][1], positionOffsets[username][2]);
                m.rotateY(rotationOffsets[username]);
                renderList.mMesh(P[username]).size(.1).color([10, 10, 10]);
            m.restore();
          }
        }
      }
   }
}

export let demoRealSense = new DemoRealSense();
