"use strict"

import { noiseGridVertices } from "../../data/NoiseGrid.js"
export let CG = {};


/////////////////// SUPPORT FOR VECTORS //////////////////////

CG.abs    = a => [Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2])];
CG.add    = (a,b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
CG.cross  = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
CG.distV3 = (a,b) => [Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2))];
CG.dot    = (a,b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
CG.equal  = (a,b) => CG.norm(CG.subtract(a, b)) < .001;
CG.ik = (a,b,C,D) => {
   let c = CG.dot(C,C), x = (1 + (a*a - b*b)/c) / 2, y = CG.dot(C,D)/c;
   for (let i = 0 ; i < 3 ; i++) D[i] -= y * C[i];
   y = Math.sqrt(Math.max(0,a*a - c*x*x) / CG.dot(D,D));
   for (let i = 0 ; i < 3 ; i++) D[i] = x * C[i] + y * D[i];
   return D;
}
CG.mix  = (a,b,t) => [ a[0]*(1-t) + b[0]*t, a[1]*(1-t) + b[1]*t, a[2]*(1-t) + b[2]*t ];
CG.norm = a => Math.sqrt(CG.dot(a, a));
CG.normalize = a => {
   let s = Math.sqrt(CG.dot(a,a));
   return [ a[0] / s, a[1] / s, a[2] / s ];
}
CG.orthogonalVector = a => {
   let c = a[1]*a[1] > Math.max(a[0]*a[0] , a[2]*a[2]) ? [1,0,0]
                              : a[2]*a[2] > a[0]*a[0]  ? [0,1,0]
			                               : [0,0,1];
   return CG.normalize(CG.cross(c, a));
}
CG.packRGB = rgb => {
   let C = i => Math.floor(256 * Math.max(0, Math.min(.9999, rgb[i]))) / 256;
   return C(0) + 256 * C(1) + 256 * 256 * C(2);
}
CG.random = function() {
   let seed, x, y, z;
   let init = s => {
      seed = s;
      x    = (seed % 30268) + 1;
      seed = (seed - (seed % 30268)) / 30268;
      y    = (seed % 30306) + 1;
      seed = (seed - (seed % 30306)) / 30306;
      z    = (seed % 30322) + 1;
   }
   init(2);
   return function(s) {
      if (s !== undefined)
         init(s);
      return ( ((x = (171 * x) % 30269) / 30269) +
               ((y = (172 * y) % 30307) / 30307) +
               ((z = (170 * z) % 30323) / 30323) ) % 1;
   }
}();
CG.sCurve = (t) => t * t * (3 - 2 * t);
CG.scale = (a,s) => [ s*a[0], s*a[1], s*a[2] ];
CG.subtract = (a,b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
CG.XY2Q = (X,Y) => {
   let Z = CG.cross(X, Y), Q;
   if (X[0] + Y[1] + Z[2] > 0) {
      let S = 2 * Math.sqrt(1 + X[0] + Y[1] + Z[2]);
      Q = [ (Z[1] - Y[2]) / S, (X[2] - Z[0]) / S, (Y[0] - X[1]) / S, S / 4 ];
   } else if (X[0] > Y[1] & X[0] > Z[2]) {
      let S = 2 * Math.sqrt(1 + X[0] - Y[1] - Z[2]);
      Q = [ S / 4, (X[1] + Y[0]) / S, (X[2] + Z[0]) / S, (Z[1] - Y[2]) / S ];
   } else if (Y[1] > Z[2]) {
      let S = 2 * Math.sqrt(1 - X[0] + Y[1] - Z[2]);
      Q = [ (X[1] + Y[0]) / S, S / 4, (Y[2] + Z[1]) / S, (X[2] - Z[0]) / S ];
   } else {
      let S = 2 * Math.sqrt(1 - X[0] - Y[1] + Z[2]);
      Q = [ (X[2] + Z[0]) / S, (Y[2] + Z[1]) / S, S / 4, (Y[0] - X[1]) / S ];
   }
   let s = Math.sign(Q[3]);
   return [ -s * Q[0], -s * Q[1], -s * Q[2], s * Q[3] ];
}


////////////////////////////// SUPPORT FOR MATRICES

CG.matrixAimZ = function(Z) {
   Z = CG.normalize(Z);
   let X0 = CG.cross([0,1,0], Z), t0 = CG.dot(X0,X0), Y0 = CG.cross(Z, X0),
       X1 = CG.cross([1,0,0], Z), t1 = CG.dot(X1,X1), Y1 = CG.cross(Z, X1),
       t = t1 / (4 * t0 + t1),
       X = CG.normalize(CG.mix(X0, X1, t)),
       Y = CG.normalize(CG.mix(Y0, Y1, t));
   return [ X[0],X[1],X[2],0, Y[0],Y[1],Y[2],0, Z[0],Z[1],Z[2],0, 0,0,0,1 ];
}
CG.matrixFromQuaternion = q => {
   var x = q[0], y = q[1], z = q[2], w = q[3];
   return [ 1 - 2 * (y * y + z * z),     2 * (z * w + x * y),     2 * (x * z - y * w), 0,
                2 * (y * x - z * w), 1 - 2 * (z * z + x * x),     2 * (x * w + y * z), 0,
                2 * (y * w + z * x),     2 * (z * y - x * w), 1 - 2 * (x * x + y * y), 0,  0,0,0,1 ];
}
CG.matrixIdentity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
CG.setMatrixIdentity = (out)  => {
  for (let i = 1; i < 15; i += 1) {
    out[i] = 0;
  }

  out[0]  = 1;
  out[5]  = 1;
  out[10] = 1;
  out[15] = 1;
};
CG.matrixInvert = a => {
  let b = [], d = 0, cf = (c, r) => {
     let s = (i, j) => a[c+i & 3 | (r+j & 3) << 2];
     return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
  }
  for (let n = 0 ; n < 16 ; n++) b.push(cf(n >> 2, n & 3));
  for (let n = 0 ; n <  4 ; n++) d += a[n] * b[n << 2];
  for (let n = 0 ; n < 16 ; n++) b[n] /= d;
  return b;
}
CG.matrixTranspose = a => {
  let b = [];
  for (let i = 0; i < 4; i ++) {
    for ( let j = 0; j < 4; j ++) {
      b.push( a[i + 4 * j]);
    }
  }
  return b;
}
CG.matrixTransposeWithF32Buffer = (b, a) => {
  let idx = 0;
  for (let i = 0; i < 4; i ++) {
    for ( let j = 0; j < 4; j ++) {

      b[idx] = a[i + 4 * j];
      idx += 1;
    }
  }
  return b;
};
CG.matrixMultiply = (a, b)   => {
   let c = [];
   for (let n = 0 ; n < 16 ; n++)
      c.push( a[n&3     ] * b[    n&12] +
              a[n&3 |  4] * b[1 | n&12] +
              a[n&3 |  8] * b[2 | n&12] +
              a[n&3 | 12] * b[3 | n&12] );
   return c;
}
CG.matrixMultiplyWithBuffer = (c, a, b) => {
   for (let n = 0 ; n < 16 ; n++) {
      c[n] =  a[n&3     ] * b[    n&12] +
               a[n&3 |  4] * b[1 | n&12] +
               a[n&3 |  8] * b[2 | n&12] +
               a[n&3 | 12] * b[3 | n&12] ;
   }
   return c;
}
CG.extractTranslation = a => [a[12], a[13], a[14]];
CG.extractScale = a => [ norm([a[0],a[1],a[ 2]]), 
                         norm([a[4],a[5],a[ 6]]), 
                         norm([a[8],a[9],a[10]]) ];
CG.extractRotation = a => {
 //TODO
 return [0,0,0];
}
CG.setTranslate = (m,t)      => {
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}

CG.matrixRotateX = t         => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return [1,0,0,0, 0,cos,sin,0, 0,-sin,cos,0, 0,0,0,1];
}
CG.matrixRotateY = t         => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return [cos,0,-sin,0, 0,1,0,0, sin,0,cos,0, 0,0,0,1];
}
CG.matrixRotateZ = t         => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return [cos,sin,0,0, -sin,cos,0,0, 0,0,1,0, 0,0,0,1];
}

CG.rotateXBuffer = CG.matrixIdentity();
CG.matrixRotateXWithBuffer = (out, t) => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  out[5]  =  cos;
  out[6]  =  sin;
  out[9]  = -sin;
  out[10] =  cos;

  return out;
}

CG.rotateYBuffer = CG.matrixIdentity();
CG.matrixRotateYWithBuffer = (out, t) => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  out[0]  =  cos;
  out[2]  = -sin;
  out[8]  =  sin;
  out[10] =  cos;

  return out;
}

CG.rotateZBuffer = CG.matrixIdentity();
CG.matrixRotateZWithBuffer = (out, t) => {
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  out[0] =  cos;
  out[1] =  sin;
  out[4] = -sin;
  out[5] =  cos;

  return out;
}

CG.scaleBuffer = CG.matrixIdentity();
CG.matrixScale = (x,y,z)     => [x,0,0,0, 0,y===undefined?x:y,0,0, 0,0,z===undefined?x:z,0, 0,0,0,1];
CG.matrixScaleUniformWithBuffer = (out, sc) => {
  out[0] = sc;
  out[5] = sc;
  out[10] = sc;

  return out;
}
CG.matrixScaleNonUniformWithBuffer = (out, x, y, z) => {
  out[0] =  x;
  out[5] =  y;
  out[10] = z;

  return out;
}

CG.matrixTransform = (m,v)   => {
   let x = v[0], y = v[1], z = v[2], w = (v[3] === undefined ? 1 : v[3]);
   return [ m[ 0] * x + m[ 4] * y + m[ 8] * z + m[12] * w,
            m[ 1] * x + m[ 5] * y + m[ 9] * z + m[13] * w,
            m[ 2] * x + m[ 6] * y + m[10] * z + m[14] * w,
            m[ 3] * x + m[ 7] * y + m[11] * z + m[15] * w ];
}
CG.matrixTranslate = (x,y,z) => y === undefined ? [1,0,0,0, 0,1,0,0, 0,0,1,0, x[0],x[1],x[2],1]
                                                : [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];

CG.translationBuffer = CG.matrixIdentity();
CG.matrixTranslateComponentsWithBuffer = (out, x,y,z) => {
  out[12] = x;
  out[13] = y;
  out[14] = z;

  return out;
}

CG.matrixTranslateVectorWithBuffer = (out, v) => {
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];

  return out;
};

export let Matrix = function() {
   let topIndex = 0,
       stack = [ CG.matrixIdentity() ],
       getVal = () => stack[topIndex],
       setVal = m => { stack[topIndex] = m; return this; }

   this.aimZ         = v       => setVal(CG.matrixMultiply(getVal(), CG.matrixAimZ(v)));
   this.invert       = ()      => setVal(CG.matrixInvert(getVal()));
   this.identity     = ()      => setVal(CG.matrixIdentity());
   this.transpose    = ()      => setVal(CG.matrixTranspose(getVal()));
   this.multiply     = a       => setVal(CG.matrixMultiply(getVal(), a));
   
   this.rotateQ      = q       => setVal(CG.matrixMultiply(getVal(), CG.matrixFromQuaternion(q)));
   this.rotateX      = t       => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateX(t)));
   this.rotateY      = t       => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateY(t)));
   this.rotateZ      = t       => setVal(CG.matrixMultiply(getVal(), CG.matrixRotateZ(t)));
   this.save         = ()      => {
       if (topIndex + 1 == stack.length) {
          stack.push(stack[topIndex].slice());
          ++topIndex;
       } else {
          ++topIndex;

          // no new allocations - just copy
          for (let i = 0; i < 16; i += 1) {
            stack[topIndex][i] = stack[topIndex-1][i];
          }
       }
   }
   this.restore      = ()      => --topIndex;
   this.scale        = (x,y,z) => setVal(CG.matrixMultiply(getVal(), CG.matrixScale(x,y,z)));
   this.set          = a       => setVal(a);
   this.transform    = v       => CG.matrixTransform(getVal(), v);
   this.translate    = (x,y,z) => setVal(CG.matrixMultiply(getVal(), CG.matrixTranslate(x,y,z)));
   this.getTranslate = ()      => CG.extractTranslation(getVal());
   this.getScale     = ()      => CG.extractScale(getVal());
   this.value        = ()      => getVal();
   this.setTranslate = t       => CG.setTranslate(getVal(), t);
}


////////////////////////////// SUPPORT FOR SPLINES

CG.evalCubicSpline = (coefs, t) => {
   t = Math.max(0, Math.min(1, t));
   let n = coefs.length / 4;
   let k = Math.min(n-1, Math.floor(n * t));
   let f = n * t - k;
   let a = coefs[4*k], b = coefs[4*k+1], c = coefs[4*k+2], d = coefs[4*k+3];
   return f * (f * (f * a + b) + c) + d;
}

CG.BezierBasisMatrix = [
   -1,  3, -3,  1,
    3, -6,  3,  0,
   -3,  3,  0,  0,
    1,  0,  0,  0
];

CG.bezierToCubic = B => {
   let n = Math.floor(B.length / 3);
   let C = [];
   for (let k = 0 ; k < n ; k++)
      C = C.concat(CG.matrixTransform(CG.BezierBasisMatrix, B.slice(3*k, 3*k+4)));
   return C;
}

CG.sampleBezierPath = (X, Y, Z, n) => {
  let P = [];
  for (let i = 0 ; i <= n ; i++)
    P.push([CG.evalCubicSpline(CG.bezierToCubic(X), i/n),
            CG.evalCubicSpline(CG.bezierToCubic(Y), i/n),
            CG.evalCubicSpline(CG.bezierToCubic(Z), i/n)]);

  // FIND A START VECTOR TO HELP COMPUTE FIRST U VECTOR

  let U, V, W = CG.normalize(CG.subtract(P[1], P[0]));
  let x = Math.abs(W[0]),
      y = Math.abs(W[1]),
      z = Math.abs(W[2]);
  U = x < Math.min(y, z) ? [1,0,0] :
      y < Math.min(x, z) ? [0,1,0] : [0,0,1];

  // CONTINUALLY MODIFY U AS PATH TURNS

  for (let i = 0 ; i < n ; i++) {
     W = CG.normalize(CG.subtract(P[i+1], P[i]));
     V = CG.normalize(CG.cross(W, U));
     U = CG.normalize(CG.cross(V, W));
     P[i].push(U[0], U[1], U[2]);      // APPEND U TO POSITION
  }
  P[n].push(U[0], U[1], U[2]);         // APPEND U TO LAST POSITION

  return P;
}

CG.crBasisMatrix = [
  -1/2,    1, -1/2,  0,
   3/2, -5/2,    0,  1,
  -3/2,    2,  1/2,  0,
   1/2, -1/2,    0,  0
];

CG.evalCRSpline = (keys, t) => {
  t = Math.max(1/1000, Math.min(1-1/1000, t));

  let n = keys.length - 1,
      i = Math.floor(n * t),
      f = n * t % 1;

  let P0 = keys[i > 0 ? i-1 : CG.equal(keys[0], keys[n]) ? n-1 : 0],
      P1 = keys[i],
      P2 = keys[i+1],
      P3 = keys[i+1 < n ? i+2 : CG.equal(keys[0], keys[n]) ? 1 : n];

  let p = [];
  for (let k = 0 ; k < 3 ; k++) {
     let C = CG.matrixTransform(CG.crBasisMatrix, [ P0[k], P1[k], P2[k], P3[k] ]);
     p.push( f * (f * (f * C[0] + C[1]) + C[2]) + C[3] );
  }
  return p;
}

////////////////////////////// SUPPORT FOR CREATING 3D SHAPES

export const VERTEX_SIZE = 9;

CG.vertexArray = (p,n,t,uv,rgb) => {
   if (! t)
      t = CG.orthogonalVector(n);
   let q = CG.XY2Q(n, t);
   return [
      p[0],p[1],p[2],
      q[0],q[1],q[2],
      uv[0],uv[1],
      CG.packRGB(rgb)
   ];
}

CG.vertexSetNormal = (V, i, n) => {
   let t = CG.orthogonalVector(n);
   let q = CG.XY2Q(n, t);
   V[i + 3] = q[0];
   V[i + 4] = q[1];
   V[i + 5] = q[2];
}

CG.vertexSetUV = (V, i, uv) => {
   V[i + 6] = uv[0];
   V[i + 7] = uv[1];
}

CG.vertexSetRGB = (V, i, rgb) => {
   V[i + 8] = CG.packRGB(rgb);
}


CG.createPoly4Vertices = V => {
   let A = [V[0],V[1],V[2]],
       B = [V[3],V[4],V[5]],
       C = [V[6],V[7],V[8]];
   let N = CG.normalize(CG.cross(CG.subtract(B,A), CG.subtract(C,B)));
   return CG.vertexArray(V.slice(0, 3), N, null, 0,0, 1,1,1).concat(
          CG.vertexArray(V.slice(3, 6), N, null, 1,0, 1,1,1).concat(
          CG.vertexArray(V.slice(9,12), N, null, 1,1, 1,1,1).concat(
          CG.vertexArray(V.slice(6, 9), N, null, 0,1, 1,1,1))));
}

CG.createQuadVertices = () =>
    CG.vertexArray([ 1, 1,0], [0,0,1], [1,0,0], [1,1], [1,1,1]).concat(
    CG.vertexArray([-1, 1,0], [0,0,1], [1,0,0], [0,1], [1,1,1]).concat(
    CG.vertexArray([ 1,-1,0], [0,0,1], [1,0,0], [1,0], [1,1,1]).concat(
    CG.vertexArray([-1,-1,0], [0,0,1], [1,0,0], [0,0], [1,1,1]))));

CG.createCubeVertices = () =>
   CG.vertexArray([+1,+1,-1], [ 0, 0,-1], [1,0,0], [0,1], [1,1,1]).concat(
   CG.vertexArray([+1,-1,-1], [ 0, 0,-1], [1,0,0], [0,0], [1,1,1]).concat(
   CG.vertexArray([-1,+1,-1], [ 0, 0,-1], [1,0,0], [1,1], [1,1,1]).concat(
   CG.vertexArray([-1,-1,-1], [ 0, 0,-1], [1,0,0], [1,0], [1,1,1]).concat(

   CG.vertexArray([-1,-1,-1], [ 0,-1, 0], [0,0,1], [0,1], [1,1,1]).concat(
   CG.vertexArray([+1,-1,-1], [ 0,-1, 0], [0,0,1], [0,0], [1,1,1]).concat(
   CG.vertexArray([-1,-1,+1], [ 0,-1, 0], [0,0,1], [1,1], [1,1,1]).concat(
   CG.vertexArray([+1,-1,+1], [ 0,-1, 0], [0,0,1], [1,0], [1,1,1]).concat(

   CG.vertexArray([+1,-1,+1], [+1, 0, 0], [0,1,0], [0,1], [1,1,1]).concat(
   CG.vertexArray([+1,-1,-1], [+1, 0, 0], [0,1,0], [0,0], [1,1,1]).concat(
   CG.vertexArray([+1,+1,+1], [+1, 0, 0], [0,0,0], [1,1], [1,1,1]).concat(
   CG.vertexArray([+1,+1,-1], [+1, 0, 0], [0,1,0], [1,0], [1,1,1]).concat(

   CG.vertexArray([+1,+1,-1], [ 0,+1, 0], [0,0,1], [0,1], [1,1,1]).concat(
   CG.vertexArray([-1,+1,-1], [ 0,+1, 0], [0,0,1], [0,0], [1,1,1]).concat(
   CG.vertexArray([+1,+1,+1], [ 0,+1, 0], [0,0,1], [1,1], [1,1,1]).concat(
   CG.vertexArray([-1,+1,+1], [ 0,+1, 0], [0,0,1], [1,0], [1,1,1]).concat(

   CG.vertexArray([-1,+1,+1], [-1, 0, 0], [0,1,0], [0,1], [1,1,1]).concat(
   CG.vertexArray([-1,+1,-1], [-1, 0, 0], [0,1,0], [0,0], [1,1,1]).concat(
   CG.vertexArray([-1,-1,+1], [-1, 0, 0], [0,1,0], [1,1], [1,1,1]).concat(
   CG.vertexArray([-1,-1,-1], [-1, 0, 0], [0,1,0], [1,0], [1,1,1]).concat(

   CG.vertexArray([-1,-1,-1], [-1, 0, 0], [0,1,0], [0,0], [1,1,1]).concat(
   CG.vertexArray([-1,-1,+1], [-1, 0, 0], [0,1,0], [1,0], [1,1,1]).concat(

   CG.vertexArray([-1,-1,+1], [ 0, 0,+1], [1,0,0], [0,1], [1,1,1]).concat(
   CG.vertexArray([+1,-1,+1], [ 0, 0,+1], [1,0,0], [0,0], [1,1,1]).concat(
   CG.vertexArray([-1,+1,+1], [ 0, 0,+1], [1,0,0], [1,1], [1,1,1]).concat(
   CG.vertexArray([+1,+1,+1], [ 0, 0,+1], [1,0,0], [1,0], [1,1,1]))))))))))))))))))))))))));

CG.foo = noiseGridVertices;

CG.uvToCylinder = (u,v) => {
   let c = Math.cos(2 * Math.PI * u);
   let s = Math.sin(2 * Math.PI * u);
   let z = Math.max(-1, Math.min(1, 10*v - 5));

   switch (Math.floor(5.001 * v)) {
   case 0: case 5: return CG.vertexArray([0,0,z], [0,0,z], [-s,c,0], [u,v], [1,1,1]); // center of back/front end cap
   case 1: case 4: return CG.vertexArray([c,s,z], [0,0,z], [-s,c,0], [u,v], [1,1,1]); // perimeter of back/front end cap
   case 2: case 3: return CG.vertexArray([c,s,z], [c,s,0], [-s,c,0], [u,v], [1,1,1]); // back/front of cylindrical tube
   }
}

CG.createMeshVertices = (M, N, uvToShape, vars) => {
   let vertices = [];
   for (let row = 0 ; row < N-1 ; row++)
      for (let col = 0 ; col < M ; col++) {
         let u = (row & 1 ? col : M-1 - col) / (M-1);
         if (col != 0 || row == 0)
         vertices = vertices.concat(uvToShape(u,  row    / (N-1), vars));
         vertices = vertices.concat(uvToShape(u, (row+1) / (N-1), vars));
      }
   return vertices;
}

CG.uvToVertex = (u,v,A,f) => {
   let e = .001,
       P = f(Math.max(0,u-e), Math.max(0, v-e), A),
       Q = f(Math.min(1,u+e), Math.max(0, v-e), A),
       R = f(Math.max(0,u-e), Math.min(1, v+e), A),
       S = f(Math.min(1,u+e), Math.min(1, v+e), A),
       T = CG.subtract(CG.add(Q,S), CG.add(P,R)),
       U = CG.subtract(CG.add(R,S), CG.add(P,Q)),
       N = CG.cross(T, U);
   return CG.vertexArray(P, CG.normalize(N), CG.normalize(T), [u,v], [1,1,1]);
}

CG.glueMeshes = (a,b) => {
  let mesh = [];
   if(! a) return b;
   else if (! b) return a;
   else {
      let appendVertex = p => {
         if (p)
            for (let n = 0 ; n < p.length ; n++)
               mesh.push(p[n]);
      }
      appendVertex(a);
      for (let i = VERTEX_SIZE; i > 0; i--)
         mesh.push(a[a.length-i]);
      for (let i = 0; i < VERTEX_SIZE; i++)
         mesh.push(b[i]);
      appendVertex(b);
   }
   return mesh;
}


// EXTRUDE A PROFILE ALONG A PATH TO CREATE A SHAPE IMAGE.

CG.extrudeToShapeImage = (profile, path) => {

   let m = profile.length;    // NUMBER OF ROWS.
   let n = path.length;       // NUMBER OF COLUMNS.

   let si = [];
   for (let j = 0 ; j < n ; j++) {
      let p  = path[j],
          p1 = path[j == n-1 ? j-1 : j+1];

      // EXTRACT POSITION P AND CROSS VECTOR U.

      let P  = [p[0], p[1], p[2]];
      let U  = [p[3], p[4], p[5]];

      // COMPUTE V PERPENDICULAR TO BOTH PATH and U.

      let W  = CG.normalize(j == n-1 ? CG.subtract(p, p1)
                                     : CG.subtract(p1, p));
      let V  = CG.normalize(CG.cross(W, U));

      // PLACE THE INDIVIDUAL VERTICES.

      si.push([]);
      for (let i = 0 ; i < m ; i++) {
         let x = profile[i][0],
             y = profile[i][1];
         si[j].push([ P[0] + x * U[0] + y * V[0],
                      P[1] + x * U[1] + y * V[1],
                      P[2] + x * U[2] + y * V[2] ]);
      }
   }
   return si;
}


// CONVERT A SHAPE IMAGE TO A TRIANGLE MESH.

CG.shapeImageToTriangleMesh = si => {
   let n = si.length;         // NUMBER OF ROWS
   let m = si[0].length;      // NUMBER OF COLUMNS
   let mesh = [];

   // EACH VERTEX MUST ALSO HAVE A NORMAL AND (u,v).

   let addVertex = (i, j) => {
      let P = si[j][i];

      // USE DIFFERENCES BETWEEN NEIGHBORING POSITIONS
      // TO COMPUTE THE SURFACE NORMAL N

      let i0 = i > 0   ? i-1 : CG.equal(si[j][i], si[j][m-1]) ? m-2 : 0;
      let i1 = i < m-1 ? i+1 : CG.equal(si[j][i], si[j][  0]) ?   1 : m-1;
      let j0 = j > 0   ? j-1 : CG.equal(si[j][i], si[n-1][i]) ? n-2 : 0;
      let j1 = j < n-1 ? j+1 : CG.equal(si[j][i], si[  0][i]) ?   1 : n-1;

      let N = CG.normalize(CG.cross(CG.subtract(si[j][i1], si[j][i0]),
                                    CG.subtract(si[j1][i], si[j0][i])));
      let T = CG.normalize(CG.cross([P[0],P[1],P[2]], N));
      mesh = mesh.concat(CG.vertexArray(P, N, T, [i/(m-1),j/(n-1)], [1,1,1]));
   }

   // BUILD AND RETURN A SINGLE TRIANGLE STRIP.

   for (let j = 0 ; j < n-1 ; j++) {
      for (let i = 0 ; i < m ; i++) {
         addVertex(i, j  );
         addVertex(i, j+1);
      }
      addVertex(m-1, j+1);
      addVertex(  0, j+1);
   }

   return mesh;
}


///////////////////// MESHES MADE FROM PARTICLES ////////////////////////

// CREATE A MESH FOR RENDERING PARTICLES

CG.particlesCreateMesh = N => {
   const vs = VERTEX_SIZE;
   let V = new Float32Array(vs*6*N);
   for (let n = 0 ; n < N ; n++) {
      for (let i = 0 ; i < 6 ; i++) {
         let v = CG.vertexArray([0,0,0],[0,0,1],[1,0,0],
	                        [i<2 ? 0 : 1, i==0 || i==2 ? 0 : 1],
				[1,1,1]);
         let K = vs * (6*n + i);
         for (let k = 0 ; k < vs ; k++)
	    V[K + k] = v[k];
      }
   }
   return V;
}

CG.particlesSetPositions = (V, A, M) => {

   if (M === undefined)
      M = CG.matrixIdentity();

   const vs = VERTEX_SIZE, skip = 6 * vs;
   const nMax = Math.min(A.length, V.length / skip);
   let copy = (i,j) => { for (let n = 0 ; n < vs ; n++) V[j+n] = V[i+n]; }
   for (let n = 0 ; n < nMax ; n++) {
      let i0 = skip * n;
      let i1 = i0 + vs;
      let i2 = i1 + vs;
      let i3 = i2 + vs;
      let i4 = i3 + vs;
      let i5 = i4 + vs;

      let r = A[n][3];
      for (let j = 0 ; j < 3 ; j++) {
         let x = M[4*j], y = M[4*j+1];
         V[i0 + j] = A[n][j] - r * x - r * y;
         V[i1 + j] = A[n][j] + r * x - r * y;
         V[i2 + j] = A[n][j] - r * x + r * y;
         V[i3 + j] = A[n][j] + r * x + r * y;
      }

      if (A[n].length > 4) {
	 let rgb = A[n].slice(4, 7);
         for (let i = 0 ; i < 4 ; i++)
	    CG.vertexSetRGB(V, i0 + i * vs, rgb);
      }

      copy(i3, i4);
      if (n > 0            ) copy(i0, i0 - vs);
      if (n == A.length - 1) copy(i4, i5);
   }

   for (let n = nMax ; n < V.length / skip ; n++)
      for (let i = 0 ; i < skip ; i++)
         V[skip * n + i] = 0;
}

// TEXT IS RENDERED AS A SINGLE MESH OF PARTICLES, ONE PER CHARACTER.

CG.ParticlesText = function(msg) {
   let V = CG.particlesCreateMesh(msg.length);
   const vs = VERTEX_SIZE, skip = 6 * vs;
   let copy = (i,j) => { for (let n = 0 ; n < vs ; n++) V[j+n] = V[i+n]; }

   let chToU0 = ch => (ch % 16) / 16 + .001;
   let chToV1 = ch => 1 - Math.floor((ch - 32) / 16) / 6;
   let chToU1 = ch => chToU0(ch) + 1 / 16 - .005;
   let chToV0 = ch => chToV1(ch) - 1 / 6;

   for (let n = 0 ; n < msg.length ; n++) {
      let i0 = skip * n;
      let i1 = i0 + vs;
      let i2 = i1 + vs;
      let i3 = i2 + vs;
      let i4 = i3 + vs;
      let i5 = i4 + vs;

      let ch = msg.charCodeAt(n);

      if (ch < 32 || ch > 127)
         ch = 32;

      CG.vertexSetUV(V, i0, [chToU0(ch), chToV0(ch)]);
      CG.vertexSetUV(V, i1, [chToU1(ch), chToV0(ch)]);
      CG.vertexSetUV(V, i2, [chToU0(ch), chToV1(ch)]);
      CG.vertexSetUV(V, i3, [chToU1(ch), chToV1(ch)]);

      copy(i3, i4);
      if (n > 0              ) copy(i0, i0 - vs);
      if (n == msg.length - 1) copy(i4, i5);
   }

   this.mesh = () => V;

   this.layout = (A, ax, ay) => {
      let isDefaultLayout = ! A;
      if (isDefaultLayout)
         A = [];

      let row = 0, col = 0;
      for (let n = 0 ; n < msg.length ; n++) {
         if (isDefaultLayout)
            A[n] = [col, -row, 0];

         let i0 = skip * n;
         let i1 = i0 + vs;
         let i2 = i1 + vs;
         let i3 = i2 + vs;
         let i4 = i3 + vs;
         let i5 = i4 + vs;

         let ch = msg.charCodeAt(n);
         if (ch == 10) {
            row++;                     // NEWLINE CHARACTER:
	    col = -1;                  // JUST START A NEW LINE
         }

         for (let j = 0 ; j < 3 ; j++) {
            let x = j==0 ? .5 : 0,
	        y = j==1 ? .5 : 0;
            for (let i = 0 ; i < 4 ; i++)
	       V[i0 + i * vs + j] = A[n][j];
            if (ch != 10) {
               V[i0 + j] += -x - y;       // SET POSITION
               V[i1 + j] +=  x - y;       // WITHIN TILE
               V[i2 + j] += -x + y;
               V[i3 + j] +=  x + y;
            }
         }

         for (let i = 0 ; i < 4 ; i++)
	    CG.vertexSetNormal(V, i0 + i * vs, [0,0,1]);

	 copy(i3, i4);
         if (n > 0              ) copy(i0, i0 - vs);
         if (n == msg.length - 1) copy(i4, i5);

         col++;
      }

      // DO OPTIONAL HORIZONTAL POSITION ADJUSTMENT

      if (ax !== undefined) {
         let xlo = 10000, xhi = -xlo;
         for (let i = 0 ; i < V.length ; i += vs) {
	    xlo = Math.min(xlo, V[i]);
	    xhi = Math.max(xhi, V[i]);
	 }
	 let dx = ax * (xlo - xhi) - xlo;
         for (let i = 0 ; i < V.length ; i += vs)
	    V[i] += dx;
      }

      // DO OPTIONAL VERTICAL POSITION ADJUSTMENT

      if (ay !== undefined) {
         let ylo = 10000, yhi = -ylo;
         for (let i = 0 ; i < V.length ; i += vs) {
	    ylo = Math.min(ylo, V[i+1]);
	    yhi = Math.max(yhi, V[i+1]);
	 }
	 let dy = ay * (ylo - yhi) - ylo;
         for (let i = 0 ; i < V.length ; i += vs)
	    V[i+1] += dy;
      }

      return A;
   }

   this.render = (renderList, m, color) => {
      m.save();
         m.scale(.5,1,1);
         renderList.mMesh(this.mesh()).color(color).setBaseTexture('font.png');
         m.rotateY(Math.PI);
         renderList.mMesh(this.mesh()).color(color).setBaseTexture('font.png');
      m.restore();
   }

   this.layout(null, .5, .5);
}


/////////////////// DEFINE ALL OF THE BASIC SHAPES /////////////////////

// EXTRUSION

CG.extrude = (profile, path) =>
    CG.shapeImageToTriangleMesh(CG.extrudeToShapeImage(profile, path));

// SPHERE

CG.uvToSphere = (u,v) => CG.uvToVertex(u,v,null, (u,v) => {
   let t = 2 * Math.PI * u,
       p = Math.PI * (v - .5);
   return [ Math.cos(t) * Math.cos(p) ,
            Math.sin(t) * Math.cos(p) ,
                          Math.sin(p) ];
});

// OPEN TUBE

CG.uvToTube = (u,v) => CG.uvToVertex(u,v,null, (u,v) => {
  let theta = 2 * Math.PI * u;
  return [ Math.cos(theta),Math.sin(theta),2*v - 1];
});

// OPEN CONE

CG.uvToCone = (u,v) => CG.uvToVertex(u,v,null, (u,v) => {
   let t = -2 * Math.PI * u;
   return [ Math.cos(t) * v ,
            Math.sin(t) * v ,
            1 - 2*v ];
});

// ROUNDED CYLINDER

CG.uvToRoundedCylinder = (u,v,p) => CG.uvToVertex(u,v,p, (u,v,p) => {
   let pow = Math.pow,
       th = 2 * Math.PI * u,
       ph = Math.PI * (v - .5),
       c = Math.cos(ph),
       s = Math.sin(ph);
       let t = pow(pow(c, p) + pow(Math.abs(s), p), 1 / p);
       return [ Math.cos(th) * c / t, Math.sin(th) * c / t, s / t ];
});

// TORUS

CG.uvToTorus = (u,v,r) => CG.uvToVertex(u,v,r, (u,v,r) => {
   let t = 2 * Math.PI * u,
       p = 2 * Math.PI * v;
   return [ Math.cos(t) * (1 + r * Math.cos(p)),
            Math.sin(t) * (1 + r * Math.cos(p)),
            r * Math.sin(p) ];
});

// DISK

CG.uvToDisk = (u,v,s) => CG.uvToVertex(u,v,s, (u,v,s) => {
  let theta = -2 * Math.PI * u,
      x = Math.cos(theta),
      y = Math.sin(theta),
      z = 0;

  if (s === undefined)
     s = 1;
  else
     z = s;
  return [ v*x*s,v*y,z];
});

// SURFACE OF REVOLUTION

CG.uvToLathe = (u,v,C) => CG.uvToVertex(u,v,C, (u,v,C) => {
  if (! Array.isArray(C)) {
     r = CG.evalCubicSpline(C, v),
     z = 2 * v - 1;
  }
   let r = CG.evalCubicSpline(C[0], v),
       z = CG.evalCubicSpline(C[1], v);
   return [ r * Math.cos(2*Math.PI*u), r * Math.sin(2*Math.PI*u), z ];
});

// DEFAULT VERSIONS OF MESHES BUILT FROM BASIC SHAPES

CG.cube            = CG.createCubeVertices();
CG.quad            = CG.createQuadVertices();
CG.sphere          = CG.createMeshVertices(32, 16, CG.uvToSphere);
CG.cylinder        = CG.createMeshVertices(32,  6, CG.uvToCylinder);
CG.roundedCylinder = CG.createMeshVertices(32, 16, CG.uvToRoundedCylinder, 8);
CG.torus           = CG.createMeshVertices(32, 16, CG.uvToTorus, 0.5);
CG.torus1          = CG.createMeshVertices(32, 16, CG.uvToTorus, 0.1);
CG.disk            = CG.createMeshVertices(32, 16, CG.uvToDisk, 1);
CG.cone            = CG.glueMeshes(CG.createMeshVertices(32, 16, CG.uvToCone),
                                   CG.createMeshVertices(32, 16, CG.uvToDisk, -1));
CG.tube            = CG.createMeshVertices(32, 16, CG.uvToTube);
CG.tube3           = CG.createMeshVertices( 4,  3, CG.uvToTube);
CG.gluedCylinder   = CG.glueMeshes(CG.tube,
                     CG.glueMeshes(CG.createMeshVertices(32, 16, CG.uvToDisk, -1),
                                   CG.createMeshVertices(32, 16, CG.uvToDisk, 1)));

