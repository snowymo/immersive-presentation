import { setUniform, drawMesh } from "./lib.js";
import { CG, Matrix } from "../CG.js";
import { materials } from "./materials.js";

export let matrix_inverse = src => {
   let dst = [], det = 0, cofactor = (c, r) => {
      let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
      return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                  - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                  + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
   }
   for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
   for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
   for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
   return dst;
 }

 export let matrix_transpose = m =>
  [ m[0],m[4],m[8],m[12], m[1],m[5],m[9],m[13], m[2],m[6],m[10],m[14], m[3],m[7],m[11],m[15] ];

 export let matrix_multiply = (a,b)   => {
   let m = [];
   for (let col = 0 ; col < 4 ; col++)
   for (let row = 0 ; row < 4 ; row++) {
      let value = 0;
      for (let i = 0 ; i < 4 ; i++)
         value += a[4*i + row] * b[4*col + i];
      m.push(value);
   }
   return m;
}

export let matrix_perspective = fl => {
   return [ 1,0,0,0, 0,1,0,0, 0,0,-1,-1/fl, 0,0,0,1 ];
 }

function Blobs() {

    this.SPHERE = 0;
    this.CYLINDER = 1;
    this.CUBE = 2;
 
    // DEFINE SOME USEFUL FUNCTIONS
    
    let cross     = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
    let dot       = (a,b) =>   a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    let normalize =   a   => { let s = Math.sqrt(dot(a,a)); return [ a[0]/s, a[1]/s, a[2]/s ]; }
 
    // CONVERT VOLUME TO A TRIANGLE MESH
    
    this.implicitSurfaceTriangleMesh = (n, isFaceted) => {
    
       // HERE IS WHERE MOST OF THE WORK HAPPENS
    
       let marchingTetrahedra = function(V, ni, nj) {
    
          // CONVENIENCE FUNCTIONS TO COMPUTE (i,j,k) FROM VOLUME INDEX n
    
          function n2i(n) { return  n             % ni; }
          function n2j(n) { return (n / dj >>> 0) % nj; }
          function n2k(n) { return  n / dk >>> 0      ; }
    
          // ADD A VERTEX AND RETURN A UNIQUE ID FOR THAT VERTEX
    
          function E(a, b) {
             if (a > b) { let tmp = a; a = b; b = tmp; }
             let ai = n2i(a), aj = n2j(a), ak = n2k(a),
                 bi = n2i(b), bj = n2j(b), bk = n2k(b);
    
             let m = (n << 6) + (ai & bi ?  1 << 6 : ai      | bi << 3)
                              + (aj & bj ? dj << 6 : aj << 1 | bj << 4)
                              + (ak & bk ? dk << 6 : ak << 2 | bk << 5);
    
             // ADD TO VERTEX ARRAY ONLY THE FIRST TIME THE VERTEX IS ENCOUNTERED
    
             if (vertexID[m] === undefined) {
                vertexID[m] = P.length / 3;
                let t = -V[n+a] / (V[n+b] - V[n+a]),
                    c = (i,a,b) => (i + a + t * (b-a)) / ni * 2 - 1;
                P.push( c(i,ai,bi), c(j,aj,bj), c(k,ak,bk) );
             }
    
             return vertexID[m];
          }
    
          // CASE WHERE WE ADD ONE TRIANGLE IN A TETRAHEDRON
    
          let tri = (a, b, c, d) => T.push(E(a,b), E(a,c), E(a,d));
    
          // CASE WHERE WE ADD TWO TRIANGLES IN A TETRAHEDRON
    
          let quad = (a, b, c, d) => {
             let bc = E(b,c), ad = E(a,d);
             T.push(bc, E(a,c), ad,  ad, bc, E(b,d));
          }
    
          // DECLARE VARIABLES
    
          let nk = V.length / (ni * nj), di = 1, dj = ni, dk = ni * nj;
          let dij = di + dj, dik = di + dk, djk = dj + dk, dijk = di + dj + dk;
          let P = [], T = [], vertexID = [], i, j, k, n, S = [0,di,dij,dijk];
    
          let lo = new Array(nj * nk),
              hi = new Array(nj * nk);
    
          // THE SIX POSSIBLE INTERMEDIATE PATHS THROUGH A TETRAHEDRON
    
          let S1 = [di , dj , dk , di , dj , dk ];
          let S2 = [dij, djk, dik, dik, dij, djk];
    
          // THERE ARE 16 CASES TO CONSIDER
    
          let cases = [ [0         ], [1, 0,1,2,3], [1, 1,2,0,3], [2, 0,1,2,3],
                        [1, 2,3,0,1], [2, 0,2,3,1], [2, 1,2,0,3], [1, 3,1,2,0],
                        [1, 3,0,2,1], [2, 0,3,1,2], [2, 1,3,2,0], [1, 2,1,0,3],
                        [2, 2,3,0,1], [1, 1,3,0,2], [1, 0,3,2,1], [0         ], ];
    
          // FOR EACH (Y,Z), DON'T DO ANY WORK OUTSIDE OF X RANGE WHERE SURFACE MIGHT BE
       
          let m = 0;
          for (k = 0 ; k < nk ; k++)
          for (j = 0 ; j < nj ; j++) {
             let n0 = m * ni, n1 = n0 + ni - 1, nn;
             for (nn = n0 ; nn <= n1 && V[nn] > 0 ; nn++) ;
             lo[m] = Math.max(0, nn-1 - n0);
             for (nn = n1 ; nn >= n0 && V[nn] > 0 ; --nn) ;
             hi[m] = Math.min(ni-1, nn+1 - n0);
             m++;
          }
    
          // FOR ALL Y AND Z IN THE VOLUME
    
          for (k = 0 ; k < nk - 1 ; k++) {
             let m = k * nj;
             for (j = 0 ; j < nj - 1 ; j++, m++) {
 
                // GO THROUGH RANGE OF X WHERE THE SURFACE MIGHT BE (IE: WITH ANY POSITIVE VALUES)
    
                let i0 = Math.min(lo[m], lo[m+1], lo[m+ni], lo[m+1+ni]);
                let i1 = Math.max(hi[m], hi[m+1], hi[m+ni], hi[m+1+ni]);
                if (i0 > i1)
                   continue;
    
                n = m * ni + i0;
                let n1 = m * ni + i1;
                let s0 = (V[n]>0) + (V[n+dj]>0) + (V[n+dk]>0) + (V[n+djk]>0), s1;
                for (i = i0 ; n <= n1 ; i++, n++, s0 = s1) {
 
                   // FOR EACH CUBE
 
                   s1 = (V[n+di]>0) + (V[n+dij]>0) + (V[n+dik]>0) + (V[n+dijk]>0);
                   if (s0 + s1 & 7) {
                      let C03 = (V[n] > 0) << 0 | (V[n+dijk] > 0) << 3;
 
                      // CYCLE THROUGH THE SIX TETRAHEDRA THAT TILE THE CUBE
 
                      for (let p = 0 ; p < 6 ; p++) {
                         let C = cases [ C03 | (V[n+S1[p]] > 0) << 1 | (V[n+S2[p]] > 0) << 2 ];
 
                         // FOR EACH TETRAHEDRON, OUTPUT EITHER ZERO, ONE OR TWO TRIANGLES
 
                         if (C[0]) {       // C[0] == number of triangles to be created.
                            S[1] = S1[p];  // assign 2nd and 3rd corners of simplex.
                            S[2] = S2[p];
                            (C[0]==1 ? tri : quad)(S[C[1]], S[C[2]], S[C[3]], S[C[4]]);
                         }
                      }
                   }
                }
             }
          }
    
          // MAKE SURE ALL TRIANGLE VERTICES ARE LISTED IN COUNTERCLOCKWISE ORDER
    
          for (let m = 0 ; m < T.length ; m += 3) {
             let a = 3 * T[m], b = 3 * T[m+1], c = 3 * T[m+2],
                 n = Math.floor(ni*(P[a  ]+1)/2)      +
                     Math.floor(ni*(P[a+1]+1)/2) * dj +
                     Math.floor(ni*(P[a+2]+1)/2) * dk,
                 u = cross([P[b] - P[a], P[b+1] - P[a+1], P[b+2] - P[a+2]],
                           [P[c] - P[b], P[c+1] - P[b+1], P[c+2] - P[b+2]]),
                 v = [ V[n+1] - V[n], V[n+dj] - V[n], V[n+dk] - V[n] ];
             if (dot(u, v) < 0) { let tmp = T[m]; T[m] = T[m + 2]; T[m + 2] = tmp; }
          }
    
          // RETURN POINTS AND TRIANGLES
    
          return [P, T];
       }
    
       // SAMPLE THE VOLUME
    
       let X = [];
       for (let i = 0 ; i < n ; i++)
          X.push((i - n/2) / (n/2));
    
       // FILL THE VOLUME WITH VALUES FROM THE IMPLICIT FUNCTION
    
       let A = [0,0,0,0,0,0], B = [0,0,0,0,0,0], C = [0,0,0,0,0,0];
       let volume = new Array(n*n*n), m = 0;
       volume.fill(-1);
 
       for (let k = 0 ; k < n ; k++) {
          let z = X[k];
          for (let j = 0 ; j < n ; j++, m += n) {
             let y = X[j];
             for (let b = 0 ; b < data.length ; b++) {
                let xBounds = blobXBounds(b, y,z);
                if (xBounds.length > 0) {
                   let i0 = Math.max(0, Math.floor(n/2 * xBounds[0] + n/2));
                   let i1 = Math.min(n, Math.floor(n/2 * xBounds[1] + n/2));
                   if (i0 < i1) {
                      for (let c = 0 ; c < 6 ; c++) {
                         let U = data[b].ABC[c], u = U[0], v = U[1]*y + U[2]*z + U[3];
                         A[c] = -u * u;
                         B[c] = -u * v * 2;
                         C[c] = -v * v;
                      }
 
                      data[b].XC =
                         data[b].type == this.SPHERE ?
                         [
                            [ A[0] + A[2] + A[4] , B[0] + B[2] + B[4] , 1 + C[0] + C[2] + C[4] ,
                              A[1] + A[3] + A[5] , B[1] + B[3] + B[5] , 1 + C[1] + C[3] + C[5] , ],
                         ] :
                         data[b].type == this.CYLINDER ?
                         [
                            [ A[0] + A[2] , B[0] + B[2] , 1 + C[0] + C[2] ,
                              A[1] + A[3] , B[1] + B[3] , 1 + C[1] + C[3] , ],
                            [ A[4] , B[4] , 1 + C[4] , A[5] , B[5] , 1 + C[5] , ],
                         ] :
                         [
                            [ A[0] , B[0] , 1 + C[0] , A[1] , B[1] , 1 + C[1] , ],
                            [ A[2] , B[2] , 1 + C[2] , A[3] , B[3] , 1 + C[3] , ],
                            [ A[4] , B[4] , 1 + C[4] , A[5] , B[5] , 1 + C[5] , ],
                         ] ;
 
                      for (let i = i0 ; i < i1 ; i++)
                         volume[m+i] += blobx(data[b], X[i]);
                   }
                }
             }
          }
       }
    
       // FIND ALL VERTICES AND TRIANGLES IN THE VOLUME
       
       let VT = marchingTetrahedra(volume, n, n);
       let V = VT[0];
       let T = VT[1];
    
       // COMPUTE SURFACE NORMALS
    
       let N = new Array(V.length);
       for (let i = 0 ; i < V.length ; i += 3) {
          let normal = computeNormal(V[i],V[i+1],V[i+2]);
          for (let j = 0 ; j < 3 ; j++)
             N[i+j] = normal[j];
       }
    
       // CONSTRUCT AND RETURN THE TRIANGLE MESH
    
       let mesh = [];
       for (let i = 0; i < T.length; i += 3) {
          let a = 3 * T[i    ],
              b = 3 * T[i + 1],
              c = 3 * T[i + 2];
    
          if (isFaceted) {
             let normal = normalize([N[a  ]+N[b  ]+N[c  ],
                                     N[a+1]+N[b+1]+N[c+1],
                                     N[a+2]+N[b+2]+N[c+2]]);
             N[a  ] = N[b  ] = N[c  ] = normal[0];
             N[a+1] = N[b+1] = N[c+1] = normal[1];
             N[a+2] = N[b+2] = N[c+2] = normal[2];
          }
    
          mesh.push( V[a],V[a+1],V[a+2] , N[a],N[a+1],N[a+2] , 0,0,0, 1,0,0,0,0,0 ,
                     V[b],V[b+1],V[b+2] , N[b],N[b+1],N[b+2] , 0,0,0, 1,0,0,0,0,0 ,
                     V[c],V[c+1],V[c+2] , N[c],N[c+1],N[c+2] , 0,0,0, 1,0,0,0,0,0 );
 
          let n = mesh.length;
          computeWeights(mesh, n - 3 * 12 + 6, V[a],V[a+1],V[a+2]);
          computeWeights(mesh, n - 2 * 12 + 6, V[b],V[b+1],V[b+2]);
          computeWeights(mesh, n - 1 * 12 + 6, V[c],V[c+1],V[c+2]);
       }
       return new Float32Array(mesh);
    }
 
    this.useSoftMin = state => isSoftMin = state;
 
    let isSoftMin = false;
 
    let minfunc = (a,b,c) => {
       if (isSoftMin) {
          a = Math.exp(1-a*a);
          b = Math.exp(1-b*b);
          c = c === undefined ? 0 : Math.exp(1-c*c);
          return 1 - Math.log(a + b + c);
       }
       else
          return c === undefined ? Math.min(a, b) : Math.min(a, b, c);
    }
 
    let massaged = (t, sgn) => t <= 0 ? 0 : (t > 1 ? 2 - 1/t/t : t*t) * sgn;
 
    let data;
 
    let blobx = (data, x) => {
       let XC = data.XC;
       let T = n => {
          let C = XC[n], t1 = x * (x * C[0] + C[1]) + C[2],
                         t0 = x * (x * C[3] + C[4]) + C[5];
          return t0 / (t0 - t1);
       }
       let t = data.type == this.SPHERE   ? T(0)
             : data.type == this.CYLINDER ? minfunc(T(0), T(1))
                                          : minfunc(T(0), T(1), T(2));
       return massaged(t, data.sign);
    }
 
    let blob = (data, x, y, z) => {
       let t;
       let A1 = data.ABC[0], a1 = A1[0]*x + A1[1]*y + A1[2]*z + A1[3],
           A0 = data.ABC[1], a0 = A0[0]*x + A0[1]*y + A0[2]*z + A0[3],
 
           B1 = data.ABC[2], b1 = B1[0]*x + B1[1]*y + B1[2]*z + B1[3],
           B0 = data.ABC[3], b0 = B0[0]*x + B0[1]*y + B0[2]*z + B0[3],
 
           C1 = data.ABC[4], c1 = C1[0]*x + C1[1]*y + C1[2]*z + C1[3],
           C0 = data.ABC[5], c0 = C0[0]*x + C0[1]*y + C0[2]*z + C0[3];
 
       let aa1 = a1*a1, aa0 = a0*a0,
           bb1 = b1*b1, bb0 = b0*b0,
           cc1 = c1*c1, cc0 = c0*c0;
 
       switch (data.type) {
       case this.SPHERE:
          {
             let t1 = 1 - (aa1 + bb1 + cc1);
             let t0 = 1 - (aa0 + bb0 + cc0);
             t = t0 / (t0 - t1);
          }
          break;
 
       case this.CYLINDER:
          {
             let tab1 = 1 - (aa1 + bb1),
                 tab0 = 1 - (aa0 + bb0),
                 tc1  = 1 - cc1,
                 tc0  = 1 - cc0,
                 tab  = Math.max(0, tab0 / (tab0 - tab1)),
                 tc   = Math.max(0, tc0  / (tc0  - tc1 ));
             t = minfunc(tab, tc);
          }
          break;
 
       case this.CUBE:
          {
             let ta1 = 1 - aa1, ta0 = 1 - aa0,
                 tb1 = 1 - bb1, tb0 = 1 - bb0,
                 tc1 = 1 - cc1, tc0 = 1 - cc0,
                 ta  = ta0 / (ta0 - ta1),
                 tb  = tb0 / (tb0 - tb1),
                 tc  = tc0 / (tc0 - tc1);
             t = minfunc(ta, tb, tc);
          }
          break;
       }
       return massaged(t, data.sign);
    }
 
    this.clear = () => data = [];
 
    this.addBlob = (type, _M, d, material) => {
       let M = _M.slice();
       let m = matrix_transpose(matrix_inverse(M));
 
       if (d === undefined)
          d = 0.5;
 
       let ad = Math.abs(d),
 
           A1 = m.slice(0,  4),
           B1 = m.slice(4,  8),
           C1 = m.slice(8, 12),
 
           da = 1 + ad * CG.norm([A1[0],A1[1],A1[2]]),
           db = 1 + ad * CG.norm([B1[0],B1[1],B1[2]]),
           dc = 1 + ad * CG.norm([C1[0],C1[1],C1[2]]),
 
           A0 = [A1[0]/da,A1[1]/da,A1[2]/da,A1[3]/da],
           B0 = [B1[0]/db,B1[1]/db,B1[2]/db,B1[3]/db],
           C0 = [C1[0]/dc,C1[1]/dc,C1[2]/dc,C1[3]/dc];
 
       data.push({
          type: type,
          ABC : [A1,A0,B1,B0,C1,C0],
          sign: Math.sign(d),
          M   : M,
       });
    }
 
    let computeXBounds = (Q, y,z) => {
       let A = Q[0];
       let B = Q[1]*y + Q[2]*z + Q[3];
       let C = Q[4]*y*y + Q[5]*y*z + Q[6]*y + Q[7]*z*z + Q[8]*z + Q[9] - 1;
 
       let discr = B*B - 4*A*C;
       if (discr <= 0)
          return [];
 
       let d = Math.sqrt(discr);
       return [ (-B-d) / (2*A) , (-B+d) / (2*A) ];
    }
 
    let blobXBounds = (b, y,z) => {
       let QA = computeQuadric(data[b].ABC[1]);
       let QB = computeQuadric(data[b].ABC[3]);
       let QC = computeQuadric(data[b].ABC[5]);
       let Q = [];
       for (let i = 0 ; i < QA.length ; i++)
          Q.push(QA[i] + QB[i] + QC[i]);
       if (data[b].type == this.CUBE)
          for (let i = 0 ; i < Q.length ; i++)
             Q[i] *= .7;
       return computeXBounds(Q, y,z);
    }
 
    this.eval = (x,y,z) => {
       let value = -1;
       for (let b = 0 ; b < data.length ; b++)
          value += blob(data[b], x,y,z);
       return value;
    }
 
    let computeWeights = (dst, i, x,y,z) => {
 
       // CREATE AN INDEXED ARRAY OF NON-ZERO WEIGHTS
 
       let index = [], value = [], sum = 0;
       for (let b = 0 ; b < data.length ; b++) {
          let v = blob(data[b], x,y,z);
          if (v > 0) {
             index.push(b);
             value.push(v);
             sum += v;
             if (index.length == 6)
                break;
          }
       }
 
       // PACK INDEX AND WEIGHT INTO INT+FRACTION PORTIONS OF THE SAME NUMBER
 
       for (let j = 0 ; j < value.length ; j++)
          dst[i + j] = index[j] + Math.max(0, Math.min(.999, value[j] / sum));
 
       for (let j = value.length ; j < 6 ; j++)
          dst[i + j] = -1;
    }
 
    // COMPUTE SURFACE NORMAL
 
    let computeNormal = (x,y,z) => {
       let e = .001, f0 = this.eval(x  ,y  ,z  ),
                     fx = this.eval(x+e,y  ,z  ),
                     fy = this.eval(x  ,y+e,z  ),
                     fz = this.eval(x  ,y  ,z+e);
       return normalize([f0-fx,f0-fy,f0-fz]);
    }
 
    let computeQuadric = A => {
       let a = A[0], b = A[1], c = A[2], d = A[3];
       return [ a*a, 2*a*b, 2*a*c, 2*a*d,
                       b*b, 2*b*c, 2*b*d,
                              c*c, 2*c*d,
                                     d*d ];
    }
 
    let solveQuadratic = (A,B,C) => {
       let discr = B*B - 4*A*C;
       if (discr < 0)
          return [];
       let d = Math.sqrt(discr);
       return [ (-B - d) / (2*A*C), (-B + d) / (2*A*C) ];
    }
 
    // NEXT TO IMPLEMENT: USE computeBounds() TO MAKE THE COMPUTATION MORE EFFICIENT.
 
    let computeBounds = () => {
       let bounds = [];
       let zBounds = (P, k,l,m, Q, a,b,c,d,e,f,g,h,i,j) => {
          a=Q[a],b=Q[b],c=Q[c],d=Q[d],e=Q[e],
          f=Q[f],g=Q[g],h=Q[h],i=Q[i],j=Q[j];
          let W = normalize(cross([2*a,b,c],[b,2*e,f])),
              vx = P[k], vy = P[l], vz = P[m],
              wx = W[0], wy = W[1], wz = W[2];
              let A = a*wx*wx + b*wx*wy + c*wz*wx + e*wy*wy + f*wy*wz + h*wz*wz,
                  B = 2*a*wx*vx + b*wx*vy + b*wy*vx + c*wz*vx + c*wx*vz + d*wx +
                      2*e*wy*vy + f*wy*vz + f*wz*vy + g*wy + 2*h*wz*vz + i*wz,
                  C = a*vx*vx + b*vx*vy + c*vz*vx + d*vx + e*vy*vy +
                      f*vy*vz + g*vy + h*vz*vz + i*vz + j;
          return solveQuadratic(A,B,C);
       }
       for (let _b = 0 ; _b < data.length ; _b++) {
      let P = data[_b].M.slice(12,15);
 
          let QA = computeQuadric(data[_b].ABC[1]);
          let QB = computeQuadric(data[_b].ABC[3]);
          let QC = computeQuadric(data[_b].ABC[5]);
          let Q = [];
          for (let i = 0 ; i < QA.length ; i++)
             Q.push(QA[i] + QB[i] + QC[i]);
          Q[9] -= 1;
 
      let xb = zBounds(P, 1,2,0, Q, 4,5,1,6,7,2,8,0,3,9);
      let yb = zBounds(P, 2,0,1, Q, 7,2,5,8,9,1,3,4,6,9);
      let zb = zBounds(P, 0,1,2, Q, 0,1,2,3,4,5,6,7,8,9);
      bounds.push([xb,yb,zb]);
       }
       return bounds;
    }
 }
 
 // CREATE SETS OF BLOBS THAT CAN THEN TURN INTO FLEXIBLE RUBBER SHEET SURFACES
 
export function ImplicitSurface(gl, M, program) {
    let blobType, blobMaterialName, blobInverseMatrices, blobMatrices, blobs = new Blobs(), divs, blur, mesh;
    let isSoftMin = false, isFaceted = false, isBlobby = false;
 
    this.SPHERE   = blobs.SPHERE;
    this.CYLINDER = blobs.CYLINDER;
    this.CUBE     = blobs.CUBE;
 
    this.useSoftMin = value => { if (value != isSoftMin) mesh = null; blobs.useSoftMin(isSoftMin = value); }
    this.setDivs    = value => { if (value != divs) mesh = null; divs = value; }
    this.setBlobby  = value => { if (value != isBlobby) mesh = null; isBlobby = value; }
    this.setBlur    = value => { if (value != blur) mesh = null; blur = value; }
    this.setFaceted = value => { if (value != isFaceted) mesh = null; isFaceted = value; }
    this.mesh       = () => mesh;
    this.remesh     = () => mesh = null;
    this.isBlobby   = () => isBlobby;
 
    this.beginBlobs = () => {
       blobs.clear();
       blobType = [];
       blobMaterialName = [];
       blobMatrices = [];
    }
 
    // ADD A SINGLE BLOB
 
    this.addBlob = (type, materialName, isNegativeShape) => {
       blobType.push(type);
       blobMaterialName.push(materialName);
       let m = materials[materialName], a = m.ambient, d = m.diffuse, s = m.specular;
       blobMatrices.push(M.value());
       if (isBlobby)
          blobs.addBlob(type, M.value(), isNegativeShape ? -blur : blur);
    }
 
    // FINAL PREPARATION FOR BLOBBY RENDERING FOR THIS ANIMATION FRAME
 
    this.endBlobs = () => {
       if (! isBlobby) {
          let draw = (b, m) => {
             M.save();
                M.set(matrix_multiply(M.value(), m));
                drawMesh(M.value(), gl, program, blobType[b] == this.CUBE     ? cubeMesh :
                         blobType[b] == this.CYLINDER ? cylinderMesh : sphereMesh,
                         blobMaterialName[b]);
             M.restore();
          }
 
          for (let b = 0 ; b < blobType.length ; b++)
             draw(b, blobMatrices[b]);
 
          setUniform(gl, program, '1f', 'uOpacity', .25);
          for (let b = 0 ; b < blobType.length ; b++)
             draw(b, growMatrix(blobMatrices[b], blur/2));
          setUniform(gl, program, '1f', 'uOpacity', 1);
 
          return;
       }
 
       if (! mesh) {
          console.log("generate mesh here")
          mesh = blobs.implicitSurfaceTriangleMesh(divs, isFaceted);
 
          blobInverseMatrices = [];
          for (let b = 0 ; b < blobMatrices.length ; b++)
             blobInverseMatrices.push(matrix_inverse(blobMatrices[b]));
       }
    
       let phongData = [],
           matrixData = [],
           invMatrixData = [];
 
       for (let b = 0 ; b < blobMaterialName.length ; b++) {
          let m = materials[blobMaterialName[b]], a = m.ambient, d = m.diffuse, s = m.specular;
          phongData = phongData.concat([a[0],a[1],a[2],0, d[0],d[1],d[2],0, s[0],s[1],s[2],s[3], 0,0,0,0]);
 
          let matrix = matrix_multiply(blobMatrices[b], blobInverseMatrices[b]);
          matrixData = matrixData.concat(matrix);
          invMatrixData = invMatrixData.concat(matrix_inverse(matrix));
       }
 
       setUniform(gl, program, 'Matrix4fv', 'uBlobPhong'  , false, phongData);
       setUniform(gl, program, 'Matrix4fv', 'uMatrices'   , false, matrixData);
       setUniform(gl, program, 'Matrix4fv', 'uInvMatrices', false, invMatrixData);
 
       setUniform(gl, program, '1f', 'uBlobby', 1);
       drawMesh(M.value(), gl, program, mesh, 'white', true);
       setUniform(gl, program, '1f', 'uBlobby', 0);
    }
 
    let growMatrix = (M, blur) => {
       M = M.slice();
       for (let col = 0 ; col <= 2 ; col++) {
          let v = M.slice(4*col, 4*col + 3);
          let scale = 1 + blur / CG.norm(v);
          for (let row = 0 ; row < 3 ; row++)
             M[4*col + row] *= scale;
       }
       return M;
    }
 }
  
 