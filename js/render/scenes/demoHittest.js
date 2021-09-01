import { m, renderList } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";
import { CG } from "../core/CG.js";

let dt = 0, startT = -1, val = 0;
let playAnim = false;

let DemoHittest = function() {
    this.background = null;
    this.loadGLTF = false;
    this.envInd = null;

    this.display = () => {

        //A cube that: when pointed at (aka "hover"): change color to light green 
        //             when input button 3 ("select" in emulator) is held down: change color to dark green
        //             when clicked: human figure dabs
        m.save();
            renderList.mCube().move(.2,1.5,0).size(.05).color(1,1,1).hitEvent(dab);
        m.restore();

        if (playAnim) {
            startT = time;
            playAnim = false;
        }
        if (startT > 0) {
            dt = 2*(time - startT);
            if (0 <= dt && dt <= 1) val = CG.sCurve(dt);
            else if (dt <= 2) val = 1 - CG.sCurve(dt-1);
            else {
                startT = -1;
                dt = 0;
                val = 0;
            }
        }
        //human figure
        m.save();
            m.translate(-0.2, 1.5, 0);
            m.scale(.2);
            m.save();
                m.translate(0,-.1,0);
                m.rotateZ(-1*(val/3));
                m.rotateX(-1*(val/3));
                m.translate(0,.1,0);
                renderList.mSphere().size(.1,.15,.1).color(1,1,1);
            m.restore();
            renderList.mSphere().move(0,-.5,0).size(.1,.35,.1).color(1,1,1);
            m.save();
                m.translate(.1,-.2,0);
                m.rotateZ(Math.PI/2 + val/4);
                m.rotateX(val/0.75);
                m.translate(0,-.1,0);
                renderList.mSphere().size(.04,.15,.04).color(1,1,1);
                m.translate(0,-.14,0);
                m.rotateX(val*2);
                m.rotateZ(val/2);
                m.translate(0,-.14,0);
                renderList.mSphere().size(.04,.15,.04).color(1,1,1);
            m.restore();
            m.save();
                m.translate(-.1,-.2,0);
                m.rotateZ(-1*(Math.PI/2 + val/4));
                m.rotateX(val/4);
                m.translate(0,-.1,0);
                renderList.mSphere().size(.04,.15,.04).color(1,1,1);
                m.translate(0,-.14,0);
                m.translate(0,-.14,0);
                renderList.mSphere().size(.04,.15,.04).color(1,1,1);
            m.restore();
        m.restore();

        //Three cubes that are put into one group
        //Add "true" as a second param of hitEvent would make that hitEvent also trigger the hitEvents of other objects in the same group
        //  (In this case all of them should turn light green when either the leftmost or rightmost cube gets pointed at)
        //Add "false" (or nothing) makes it not trigger others
        m.save();
            renderList.mCube().move(.2,1.2,0).size(.05).color(1,1,1).hitEvent(turnGreen, true).group(1);
            renderList.mCube().move(0,1.2,0).size(.05).color(1,1,1).hitEvent(turnGreen, false).group(1);
            renderList.mCube().move(-.2,1.2,0).size(.05).color(1,1,1).hitEvent(turnGreen, true).group(1);
        m.restore();
    }
}

let dab = (ev) => {
    ev.hitItem.color([0.3, 1, 0.3]);

    if (ev.state === "dragged" && ev.buttonState[3] === true) {
        ev.hitItem.color([0,0.5,0]);
    }

    if (ev.state === "pressed") {
        playAnim = true;
    }
}

let turnGreen = (ev) => {
    ev.hitItem.color([0.3, 1, 0.3]);
}

export let demoHittest = new DemoHittest();