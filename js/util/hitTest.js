import { m, renderList } from "../render/core/renderList.js";
import { buttonState, controllerMatrix } from "../render/core/renderListScene.js";
import { Ray } from "../render/math/ray.js";
import { mat4, vec3, vec4 } from "../render/math/gl-matrix.js";

let inputSources = [];
let frame = null;
let refSpace = null;

export let setFrameInfo = (_inputSources, _frame, _refSpace) => {
    inputSources = _inputSources;
    frame = _frame;
    refSpace = _refSpace;
}

export let pHitTest = (index) => {
    let inputSource = inputSources[index];

    const targetRayPose = frame.getPose(
        inputSource.targetRaySpace,
        refSpace,
    );
    if (!targetRayPose) {
        console.log("no targetRayPose");
        return;
    }
    //console.log(targetRayPose);
    //console.log(targetRayPose.transform.matrix);
    //console.log(controllerMatrix.right);
    let ray = new Ray(targetRayPose.transform.matrix);
    //let ray = new Ray(controllerMatrix.right);
    //console.log(ray);
    let items = renderList.getItems();
    let t = -1, T = 100000;
    let hm = null;
    for (let i=0; i<items.length; i++) {
        let matrix = items[i].matrix;
        let mInv = [];
        mat4.invert(mInv, matrix);

        let rayOrigin = [];
        let rayDir = [];
        let objectRayOrigin = vec3.transformMat4(rayOrigin, ray.origin, mInv);
        let objectRayDir = vec4.transformMat4(rayDir, [ray._dir[0], ray._dir[1], ray._dir[2], 0], mInv);
        objectRayDir = [objectRayDir[0], objectRayDir[1], objectRayDir[2]];
        vec3.normalize(objectRayDir, objectRayDir);
        let objectRay = {V: objectRayOrigin, W: objectRayDir};
        
        switch (items[i].mesh) {
            case "sphere": t = rayTraceToUnitSphere(objectRay);
                            break;
            case "cube": t = rayTraceToUnitCube(objectRay);
                            break;
            case "cylinder": t = rayTraceToCylinder(objectRay);
                            break;
            //default: t = -1;
            default: t = rayTraceToUnitSphere(objectRay);
        }
        if (t >= 0) {
            if (t < T) {
                T = t;
                hm = items[i];
            }
        }

    }
    return hm;
}

let rayTraceToUnitSphere = ray => {
    let B = vec3.dot(ray.V, ray.W);
    let C = vec3.dot(ray.V, ray.V) - 1;
    return B * B > C ? -B - Math.sqrt(B * B - C) : -1;
}

let rayTraceToUnitCube = ray => {
    let tx1 = (-1-ray.V[0]) / ray.W[0];
    let tx2 = (1-ray.V[0]) / ray.W[0];
    let ty1 = (-1-ray.V[1]) / ray.W[1];
    let ty2 = (1-ray.V[1]) / ray.W[1];
    let tz1 = (-1-ray.V[2]) / ray.W[2];
    let tz2 = (1-ray.V[2]) / ray.W[2];
    let inMax = Math.max(Math.min(tx1,tx2), Math.min(ty1,ty2), Math.min(tz1,tz2));
    let outMin = Math.min(Math.max(tx1,tx2), Math.max(ty1,ty2), Math.max(tz1,tz2));
    /*
    if (inMax >= outMin) return -1;
    let side = [];
    if (inMax === tx1) side = [-1,0,0];
    if (inMax === tx2) side = [1,0,0];
    if (inMax === ty1) side = [0,-1,0];
    if (inMax === ty2) side = [0,1,0];
    if (inMax === tz1) side = [0,0,-1];
    if (inMax === tz2) side = [0,0,1];
    return [inMax, side];
    */
    return inMax < outMin ? inMax : -1;
}

let rayTraceToCylinder = ray => {
    // the cap part
    let y1 = (-1 - ray.V[2]) / ray.W[2];
    let y2 = (1 - ray.V[2]) / ray.W[2];
    let tCapIn = Math.min(y1, y2);
    let tCapOut = Math.max(y1, y2);

    // the tube part
    let tTubeIn, tTubeOut;

    if (ray.W[0] !== 0 || ray.W[1] !== 0) {
        let A = ray.W[0] * ray.W[0] + ray.W[1] * ray.W[1];
        let B = 2 * ray.V[0] * ray.W[0] + 2 * ray.V[1] * ray.W[1];
        let C = ray.V[0] * ray.V[0] + ray.V[1] * ray.V[1] - 1;
        let d = B * B - 4 * A * C;
        if (d < 0) return -1;

        let x1 = (-1 * B - Math.sqrt(d)) / (2 * A);
        let x2 = (-1 * B + Math.sqrt(d)) / (2 * A);
        tTubeIn = Math.min(x1, x2);
        tTubeOut = Math.max(x1, x2);
    }
    else {
        let d = ray.V[0] * ray.V[0] + ray.V[1] * ray.V[1];
        if (d > 1) return -1;

        tTubeIn = tCapIn;
        tTubeOut = tCapOut;
    }

    let inMax = Math.max(tTubeIn, tCapIn);
    let outMin = Math.min(tTubeOut, tCapOut);
    
    return inMax < outMin ? inMax : -1;
}