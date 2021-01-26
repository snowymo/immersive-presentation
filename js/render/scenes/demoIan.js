import { CG } from "../core/CG.js";
import { m, renderList } from "../core/renderList.js";
import { time, viewMatrix } from "../core/renderListScene.js";

let snitchPos = [0,2,-1];
let currentDir = [0,0,1];

let startPos = snitchPos;
let targetPos = [1,2,-1];
let t = 0;
let timeStamp = 0;

let freeze = false;
let freezeStamp = 0;
let freezeLength = 0;

export let demoIan = () => {
	m.save();
		if (!freeze) {
			if (t === 0) {
				timeStamp = time+0.001;
			}
			t = time - timeStamp;
			for (let i=0; i<snitchPos.length; i++) {
				snitchPos[i] = startPos[i] + t * (targetPos[i] - startPos[i]);
			}
			if (t >= 1 || norm(subtract(snitchPos, targetPos)) <= 0.01) {
				startPos = snitchPos;
				targetPos = [Math.random()*2 - 1, Math.random()+1, Math.random()*2 - 1];
				t = 0;

				if (Math.random() < 0.5) {
					// freeze for a while
					freeze = true;
					freezeStamp = time;
					freezeLength = Math.random()*2;
				}
			}
		}
		else {
			if (time - freezeStamp > freezeLength) {
				// resume
				freeze = false;
			}
		}
		
    	m.translate(snitchPos);
    	m.scale(.2);
    	headTo(targetPos);
    	renderList.mSphere().size(.1).color([1,0.85,0]);
    	m.save();
   			m.scale(.08);
   			m.save();
  				m.rotateZ(1.2 * Math.PI/8);
   				m.translate(-0.7,1,0);
   				m.rotateX(Math.PI/3 * Math.sin(time * 35));
   				m.translate(-0.7,1,0);
		    	renderList.mTriangle().color([1,0.85,0]);
		    m.restore();
    	m.restore();
    	m.save();
   			m.scale(.08);
   			m.save();
   				m.rotateY(Math.PI);
  				m.rotateZ(1.2 * Math.PI/8);
   				m.translate(-0.7,1,0);
   				m.rotateX(-Math.PI/3 * Math.sin(time * 35));
   				m.translate(-0.7,1,0);
		    	renderList.mTriangle().color([1,0.85,0]);
		    m.restore();
    	m.restore();
    m.restore();
}

function subtract(a,b) {
	let ret = [];
	for (let i=0; i<a.length; i++) {
		ret[i] = a[i]-b[i];
	}
	return ret;
}

function dot(a,b) {
	let ret = 0;
	for (let i=0; i<a.length; i++) {
		ret += a[i]*b[i];
	}
	return ret;
}

function norm(a) {
	return Math.sqrt(dot(a,a));
}

function normalize(a) {
	let n = norm(a);
	let ret = [];
	for (let i=0; i<a.length; i++) {
		ret[i] = a[i] / n;
	}
	return ret;
}

function getAngle(a,b) {
	if (norm(a) === 0 || norm(b) === 0) return 0;
	let cosTheta = dot(a,b) / (norm(a) * norm(b));
	let theta = Math.acos(cosTheta);
	if (b[0] < 0) theta = Math.PI * 2 - theta;
	return theta;
}

function headTo(targetPos) {
	let direction = subtract(targetPos, snitchPos);
	let yRotAng = getAngle([currentDir[0], currentDir[2]], [direction[0], direction[2]]);
	m.rotateY(yRotAng);
}