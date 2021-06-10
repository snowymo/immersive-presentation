import { ImplicitSurface } from "../core/implicit_surfaces/implicitSurface.js";
import { m } from "../core/renderList.js";
import { time } from "../core/renderListScene.js";

const N = 4;
let implicitSurface = null;

let ImplicitSurfacesPgm = function () {
    this.program = null;
    this.vao = null;
    this.buffer = null;
    this.phongData = null;
    this.matrixData = null;
    this.invMatrixData = null;
    this.mesh = null;
    this.color = null;
    this.M = null;

    this.initBuffer = (gl) => {
    this.buffer = gl.createBuffer();
    };
    this.initVAO = (gl) => {
    this.vao = gl.createVertexArray();
    };

    this.assignValues = (phongData, matrixData, invMatrixData, mesh, color, M) => {
        this.phongData = phongData;
        this.matrixData = matrixData;
        this.invMatrixData = invMatrixData;
        this.mesh = mesh;
        this.color = color;
        this.M = M;
    }
};

export let implicitSurfacesPgm = new ImplicitSurfacesPgm();
let colorID = ['red','white','yellow','blue','brass'];
export function drawImplicitSurfaceObj() {
    // console.log(implicitSurfacesPgm)
    if(!implicitSurface) implicitSurface = new ImplicitSurface(m);
    implicitSurface.setBlobby(1); 
    implicitSurface.setDivs(50);
    implicitSurface.setFaceted(0);
    implicitSurface.setBlur(1); 

    m.save();
        m.translate(0,0.6,0);
        implicitSurface.beginBlobs();
        for (let n = 0 ; n < N ; n++) {
            let T = (a,b,c) => .1 * Math.sin(a * Math.sin(b * time * (10+n)/10 + n + c));
            m.save();
                m.translate(T(14,.035,1), T(24,.024,2), T(34, .014, 3));
                m.scale(0.1);
                implicitSurface.addBlob(implicitSurface.SPHERE, colorID[n]);
                // implicitSurface.addBlob(implicitSurface.CYLINDER, 'white');
            m.restore();
        }
        m.rotateY(time / 4);
        implicitSurface.remesh();
        implicitSurfacesPgm.assignValues(...implicitSurface.endBlobs());
    m.restore();
}