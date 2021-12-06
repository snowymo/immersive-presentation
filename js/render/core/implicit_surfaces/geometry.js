
//------ CREATING MESH SHAPES
import { CG } from "../CG.js"
export const VERTEX_POS  =  0;
export const VERTEX_ROT  =  3;
export const VERTEX_UV   =  6;
export const VERTEX_RGB  =  8;
export const VERTEX_WTS  =  9;
export const VERTEX_NULL = 15;
export const VERTEX_SIZE = 16;

let packAB = (a,b) => {
   a = Math.max(0, Math.min(.9999, .5 * a + .5));
   b = Math.max(0, Math.min(.9999, .5 * b + .5));
   return Math.floor(40000 * a) + b;
}

let packRGB = rgb => {
   let C = i => Math.floor(256 * Math.max(0, Math.min(.9999, rgb[i]))) / 256;
   return C(0) + 256 * C(1) + 256 * 256 * C(2);
}

// CREATE A MESH FROM A PARAMETRIC FUNCTION

let vertexArray = (pos, nor, tan, uv, rgb, wts) => {
   if (! tan) tan = orthogonalVector(nor);
   if (! uv ) uv  = [0,0];
   if (! rgb) rgb = [1,1,1];
   if (! wts) wts = [1,0,0,0,0,0];
   return [
      pos[0],pos[1],pos[2],
      packAB(nor[0],tan[0]),
      packAB(nor[1],tan[1]),
      packAB(nor[2],tan[2]),
      uv[0],uv[1],
      packRGB(rgb),
      wts[0],wts[1],wts[2],
      wts[3],wts[4],wts[5],
      0,
   ];
}

let orthogonalVector = v => {
   let x = v[0], y = v[1], z = v[2];
   let c = x > Math.max(y, z) ? [ 0, 0, 1] :
           x < Math.min(y, z) ? [ 0, 0,-1] :
           y > Math.max(z, x) ? [ 1, 0, 0] :
           y < Math.min(z, x) ? [-1, 0, 0] :
           z > Math.max(x, y) ? [ 0, 1, 0] :
                                [ 0,-1, 0] ;
   return CG.normalize(CG.cross(c, v));
}

let createMesh = (nu, nv, f, data) => {
   let tmp = [];
   for (let v = 0 ; v < 1 ; v += 1/nv) {
      for (let u = 0 ; u <= 1 ; u += 1/nu) {
         tmp = tmp.concat(f(u,v,data));
         tmp = tmp.concat(f(u,v+1/nv,data));
      }
      tmp = tmp.concat(f(1,v,data));
      tmp = tmp.concat(f(0,v+1/nv,data));
   }
   return new Float32Array(tmp);
}

// GLUE TWO MESHES TOGETHER INTO A SINGLE MESH

let glueMeshes = (a, b) => {
   let c = [];
   for (let i = 0 ; i < a.length ; i++)
      c.push(a[i]);                           // a
   for (let i = 0 ; i < VERTEX_SIZE ; i++)
      c.push(a[a.length - VERTEX_SIZE + i]);  // + last vertex of a
   for (let i = 0 ; i < VERTEX_SIZE ; i++)
      c.push(b[i]);                           // + first vertex of b
   for (let i = 0 ; i < b.length ; i++)
      c.push(b[i]);                           // + b
   return new Float32Array(c);
}

let createSquareMesh = (i, z) => {
   let vs = VERTEX_SIZE, j = z < 0 ? (i + 2) % 3 : (i + 1) % 3,
                             k = z < 0 ? (i + 1) % 3 : (i + 2) % 3;

   let A = []; A[i] = z; A[j] = -1; A[k] =  1;
   let B = []; B[i] = z; B[j] =  1; B[k] =  1;
   let C = []; C[i] = z; C[j] = -1; C[k] = -1;
   let D = []; D[i] = z; D[j] =  1; D[k] = -1;
   let N = []; N[i] = z < 0 ? -1 : 1; N[j] = 0; N[k] = 0;

   let V = [];
   V = V.concat(vertexArray(A, N));
   V = V.concat(vertexArray(B, N));
   V = V.concat(vertexArray(C, N));
   V = V.concat(vertexArray(D, N));

   return new Float32Array(V);
}

let uvToTorus = (u,v,r) => {
   let theta = 2 * Math.PI * u;
   let phi   = 2 * Math.PI * v;

   let x = Math.cos(theta) * (1 + r * Math.cos(phi));
   let y = Math.sin(theta) * (1 + r * Math.cos(phi));
   let z = r * Math.sin(phi);

   let nx = Math.cos(theta) * Math.cos(phi);
   let ny = Math.sin(theta) * Math.cos(phi);
   let nz = Math.sin(phi);

   return vertexArray([x,y,z], [nx,ny,nz]);
}

let uvToSphere = (u,v) => {
   let theta = 2 * Math.PI * u;
   let phi   = Math.PI * (v - .5);
   let x = Math.cos(theta) * Math.cos(phi);
   let y = Math.sin(theta) * Math.cos(phi);
   let z = Math.sin(phi);

   return vertexArray([x,y,z], [x,y,z]);
}

let uvToTube = (u,v) => {
   let theta = 2 * Math.PI * u;
   let x = Math.cos(theta);
   let y = Math.sin(theta);
   let z = 2 * v - 1;

   return vertexArray([x,y,z], [x,y,0]);
}

let uvToDisk = (u,v,dz) => {
   if (dz === undefined)
      dz = 0;
   let theta = 2 * Math.PI * u;
   let x = Math.cos(theta) * v;
   let y = Math.sin(theta) * v;
   let z = dz;

   return vertexArray([x,y,z], [0,0,dz ? Math.sign(dz) : 1]);
}

export let squareMesh = createSquareMesh(2, 0);

export let cubeMesh = glueMeshes(
               glueMeshes(glueMeshes(createSquareMesh(0,-1),createSquareMesh(0,1)),
                          glueMeshes(createSquareMesh(1,-1),createSquareMesh(1,1))),
                          glueMeshes(createSquareMesh(2,-1),createSquareMesh(2,1)) );
export let torusMesh    = createMesh(32, 16, uvToTorus, .5);
export let sphereMesh   = createMesh(32, 16, uvToSphere);
export let tubeMesh     = createMesh(32, 2, uvToTube);
export let diskMesh     = createMesh(32, 2, uvToDisk);
export let diskNMesh    = createMesh(32, 2, uvToDisk, -1);
export let diskPMesh    = createMesh(32, 2, uvToDisk,  1);
export let cylinderMesh = glueMeshes(glueMeshes(tubeMesh, diskPMesh), diskNMesh);

