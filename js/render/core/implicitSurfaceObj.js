import { ImplicitSurface } from "../core/implicit_surfaces/implicitSurface.js";
import { m } from "../core/renderList.js";
import { is_gl, is_pgm } from "../core/renderer.js";
import { time } from "../core/renderListScene.js";
const N = 10;
export function drawImplicitSurfaceObj() {
    let implicitSurface = new ImplicitSurface(is_gl, m, is_pgm);
    implicitSurface.setBlobby(1); 
    implicitSurface.setDivs(50);
    implicitSurface.setFaceted(0);
    implicitSurface.setBlur(1); 

    m.save();
        implicitSurface.beginBlobs();
        for (let n = 0 ; n < N ; n++) {
            let T = (a,b,c) => .3 * Math.sin(a * Math.sin(b * time * (10+n)/10 + n + c));
            m.save();
                m.translate(T(14,.035,1), T(24,.024,2), T(34, .014, 3));
                m.scale(.3);
                implicitSurface.addBlob(implicitSurface.SPHERE, 'white');
            m.restore();
        }
        m.rotateY(time / 4);
        implicitSurface.remesh();
        implicitSurface.endBlobs();
    m.restore();
}