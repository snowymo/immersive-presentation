/*
        DONE:

        Add a centering on/off mode (when mouse is over background).
        Add cubes and cylinders.
        Change to better vertex structure.
        Use correct coords for translate, rotate, scale.
        Small blobs float in front of larger blobs.
        Hold down 'a' key to create a new blob.
        Client side storage.
        Implement undo/redo.
        Create joints and compute joint position.
	Hold down the T|R|S key and drag to move|turn|scale an entire subtree.
	Replace reference in blob to parent object by parent id.

        TODO:

	Fix the bug in translating mirror hierarchy

        Duplicate a blob.
        Save to / load from Web server.
        Implement rotational joints:
                Need to tie in to IK.
                Need to tie in to procedural animation system.
*/
import { CG, Matrix } from "../CG.js";
import { ImplicitSurface } from "./implicitSurface.js";
import { materials } from "./materials.js";
import { ProjectManager } from "./projectManager.js";
import { m, renderList } from "../renderList.js";

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

 export function Modeler(canvas) {
   let M = new Matrix();
   let S = [];
   let activeCount = -1;
   let blur = 0.2;
   let fl = 3;                                                          // CAMERA FOCAL LENGTH
   let flash = false;
   let frameCount = 0;
   let isCentering = false;
   let isClick = false;
   let isCreating = false, isTranslating = false, isRotating = false, isScaling = false;
   let isFaceted = false;
   let isLightColor = false;
   let isPressed = false;
   let isRubber = false;
   let isShowingBounds = false;
   let isShowingJoints = false;
   let isWiggling = false;
   let mn = -1, mnPrev = -1, sn = -1;
   let projectManager = new ProjectManager();
   let rotation = 0, rotationState = 0;
   let startTime = Date.now(), prevTime = startTime, fps = 10;          // TO TRACK FRAME RATE
   let viewMatrix = CG.matrixIdentity();
   let viewMatrixInverse = CG.matrixIdentity();
   let xPrev, yPrev, xyTravel;
   let implicitSurface = new ImplicitSurface(m);
 
   let activeSet   = isActive => activeCount = isActive ? 4 : -1;
   let activeState = () => activeCount >= 0;
   let activeTimer = () => activeCount--;

   this.implicitSurfacesPgm = new ImplicitSurfacesPgm();

   let r = canvas.getBoundingClientRect();
   let toX = x => 2 * (x-18 - r.left) / canvas.width - 1,
      toY = y => (canvas.height - 2 * (y - r.top)) / canvas.width;

   if (! canvas.onDrag      ) canvas.onDrag       = (x, y) => { };
   if (! canvas.onMove      ) canvas.onMove       = (x, y) => { };
   if (! canvas.onPress     ) canvas.onPress      = (x, y) => { };
   if (! canvas.onRelease   ) canvas.onRelease    = (x, y) => { };
   if (! canvas.onKeyPress  ) canvas.onKeyPress   = key => { };
   if (! canvas.onKeyRelease) canvas.onKeyRelease = key => { };

   canvas.addEventListener('mousemove', function(e) {
      this._response = this._isDown ? this.onDrag : this.onMove;
      this._response(toX(e.clientX), toY(e.clientY));
   });

   canvas.addEventListener('mousedown', function(e) {
      this.onPress(toX(e.clientX), toY(e.clientY));
      this._isDown = true ;
   });

   canvas.addEventListener('mouseup'  , function(e) {
      this.onRelease(toX(e.clientX), toY(e.clientY));
      this._isDown = false;
   });

   window.addEventListener('keydown', function(e) {
      canvas.onKeyPress(e.keyCode);
   }, true);

   window.addEventListener('keyup', function(e) {
      canvas.onKeyRelease(e.keyCode);
   }, true);
 
    // ANIMATE AND RENDER ONE FRAME
 
    let S_to_load = null,
        loadFunction = arg => S_to_load = arg;
 
    this.animate = () => {
       let temp = CG.matrixMultiply(window.views[0].projectionMatrix,window.views[0].viewMatrix);
       viewMatrix = temp;
       temp = CG.matrixInvert(temp);
       viewMatrixInverse = temp;
      //  if (window.clay_window)
      //     clay_window.bgColor = flash ? '#404040' : '#202020';
       if (S_to_load) {
          S = S_to_load;
          S_to_load = null;
          activeSet(true);
       }
 
       // FETCH AND UPDATE CURRENT PROJECT
 
      //  if (frameCount == 0)
      //     projectManager.load(loadFunction);
 
      //  if (frameCount % 100 == 99)
      //     projectManager.save(S);
 
       frameCount++;
 
       // UPDATE TIME
    
       let time = (Date.now() - startTime) / 1000;
       let elapsed = time - prevTime;
       fps = .1 * fps + .9 / elapsed;
       prevTime = time;

 
       // SHOW CENTERING INDICATOR
 
       if (! isRubber && isCentering) {
          M.save();
             M.translate(0,0,-1);
             M.scale(.005,2,.005);
             m.save();
             m.set(M.value());
             renderList.mCube().color(0.5,0.5,0.5);
             m.restore();
            //  drawMesh(cubeMesh, 'white');
          M.restore();
       }
    
       // SET IMPLICIT SURFACE PROPERTIES
    
       implicitSurface.setBlobby(1);
       implicitSurface.setBlur(blur);
       implicitSurface.setDivs(isRubber ? 100 : activeState() ? 50 : 100);
       implicitSurface.setFaceted(isFaceted);
 
       // ADVANCE THE "ACTIVE REMESHING" TIMER
 
       activeTimer();
 
       // SAVE MATRICES BEFORE DOING ANY JOINT ROTATION
 
       for (let n = 0 ; n < S.length ; n++)
          S[n].M_save = S[n].M.slice();
 
       // DO ALL JOINT ROTATION
 
       if (isWiggling)
          for (let n = 0 ; n < S.length ; n++)
             if (S[n].jointPosition) {
                S[n].jointRotation = CG.matrixMultiply(
                                     CG.matrixMultiply(
                     CG.matrixRotateX(.1 * Math.sin(8 * prevTime + S[n].id * 10)),
                     CG.matrixRotateY(.1 * Math.sin(8 * prevTime + S[n].id * 20))),
                     CG.matrixRotateZ(.1 * Math.sin(8 * prevTime + S[n].id * 30)));
                rotateAboutJoint(n);
             }
 
       // DRAW THE SCENE
    
       implicitSurface.beginBlobs();
 
       // SHOW JOINTS IF IN JOINT SHOWING MODE
 
       if (isShowingJoints)
          for (let n = 0 ; n < S.length ; n++) {
             let s = S[n];
             if (s.jointPosition) {
 
            // SHOW JOINT
 
                M.save();
                   M.set(s.M);
                   M.translate(s.jointPosition);
                   let sc = i => .03 / CG.norm(M.value().slice(4*i,4*i+3));
                   M.scale(sc(0), sc(1), sc(2));
                   m.set(M.value());
                   renderList.mSphere().color(0.5,0.5,0.5);
                   m.restore();
                  //  drawMesh(sphereMesh, 'white');
                M.restore();
 
            // SHOW CONNECTION BETWEEN PARENT AND CHILD JOINT
 
               if (parent(s) && parent(s).jointPosition) {
                  M.save();
                  let p1 = CG.matrixTransform(parent(s).M, parent(s).jointPosition);
                  let p2 = CG.matrixTransform(s.M, s.jointPosition);
                  M.translate(CG.mix(p1, p2, 0.5));
                  let dp = [p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]];
                  M.aimZ(dp);
                  M.scale(.01,.01,CG.norm(dp) / 2);
                  m.set(M.value());
                  renderList.mTube().color(0.5,0.5,0.5);
                  m.restore();
                  // drawMesh(tubeMesh, 'white');
                  M.restore();
               }
             }
          }
 
       // SPECIFY BLOBS FOR THIS FRAME
          console.log("blob num: " + S.length);
       for (let n = 0 ; n < S.length ; n++) {
          M.save();
             M.set(S[n].M);
             let materialId = S[n].color;
 
         // IF IN BLOBBY MODE, ADD TO LIST OF BLOBS
 
             if (S[n].isBlobby) {
                let m = materials[materialId];
                m.specular = isRubber ? [0,0,0,20] : [.4,.4,.4,8];
                implicitSurface.addBlob(
                   S[n].type==4 ? implicitSurface.CUBE :
                   S[n].type==3 ? implicitSurface.CYLINDERZ :
                   S[n].type==2 ? implicitSurface.CYLINDERY :
                   S[n].type==1 ? implicitSurface.CYLINDERX :
                                  implicitSurface.SPHERE,
                   S[n].rounded,
                   CG.matrixMultiply(viewMatrix,M.value()),
                   materialId,
                   S[n].sign == -1,
                   n==mn || n==sn);
             }
 
         // IF NOT IN BLOBBY MODE, DRAW THE SHAPE
 
             else {
                let ma = materials[materialId];
                ma.specular = [.9,.9,.9,30];
                if (n == mn || n == sn)
                   ma.texture = [.5,0,0,0];
                M.save();
                   switch (S[n].type) {
                   case 1: M.rotateY(Math.PI/2); break;
                   case 2: M.rotateX(Math.PI/2); break;
                   }
                  //  drawMesh(S[n].type==4 ? cubeMesh :
                  //           S[n].type> 0 ? cylinderMesh :
                  //                          sphereMesh, materialId);
                M.restore();
                if (ma.texture)
                   delete ma.texture;
                ma.specular = [.1,.1,.1,2];
             }
          M.restore();
       }
 
       // IF SHOWING JOINTS, MAKE BLOB MODEL TRANSPARENT
 
      //  if (isShowingJoints)
      //     setUniform('1f', 'uOpacity', 0.1);
      //  setUniform('1f', 'uNoisy', isRubber ? 1 : 0);
      this.implicitSurfacesPgm.assignValues(...implicitSurface.endBlobs());
      //  setUniform('1f', 'uNoisy', 0);
      //  setUniform('1f', 'uOpacity', 1);
 
       // SHOW VISUAL HINT OF ANY NEGATIVE SHAPES
 
       if (! isRubber) {
         //  setUniform('1f', 'uOpacity', .25);
          for (let n = 0 ; n < S.length ; n++)
             if (S[n].sign == -1) {
                M.save();
                   M.set(CG.matrixMultiply(viewMatrix, S[n].M));
                   let m = materials[S[n].color];
                   if (n == mn || n == sn)
                      m.texture = [.5,0,0,0];
                  //  drawMesh(sphereMesh, S[n].color);
                   if (m.texture)
                      delete m.texture;
                M.restore();
             }
         //  setUniform('1f', 'uOpacity', 1);
       }
 
       // OPTIONALLY SHOW BOUNDING BOXES AROUND BLOBS
 
       if (isShowingBounds) {
          let bounds = implicitSurface.bounds();
         //  setUniform('1f', 'uOpacity', 0.2);
          for (let n = 0 ; n < bounds.length ; n++) {
             let b = bounds[n];
             let x0 = b[0][0], x1 = b[0][1];
             let y0 = b[1][0], y1 = b[1][1];
             let z0 = b[2][0], z1 = b[2][1];
             M.save();
                M.set(viewMatrix);
                M.translate((x0+x1)/2, (y0+y1)/2, (z0+z1)/2);
                M.scale((x1-x0)/2, (y1-y0)/2, (z1-z0)/2);
               //  drawMesh(cubeMesh, 'white');
               m.set(M.value());
               renderList.mCube().color(0.5,0.5,0.5);
               m.restore();
             M.restore();
          }
         //  setUniform('1f', 'uOpacity', 1);
       }
 
       // POSSIBLY REBUILD THE IMPLICIT SURFACE, THEN DRAW IT
 
       if (! isRubber && activeState() && frameCount % 4 == 0)
          implicitSurface.remesh();
 
       // RESTORE MATRICES TO BEFORE JOINT ROTATIONS
 
       for (let n = 0 ; n < S.length ; n++)
          S[n].M = S[n].M_save;
 
       // HANDLE ROTATING THE VIEW
    
       let rotationTarget = Math.PI / 2 * rotationState,
           delta = 2 * elapsed;
       if (rotation != rotationTarget) {
          if (rotation > rotationTarget) rotation -= delta;
          if (rotation < rotationTarget) rotation += delta;
          if (Math.abs(rotation - rotationTarget) < delta) {
             rotation = rotationTarget;
             mn = findBlob(xPrev, yPrev);
          }
       }
 
       let viewMatrixPrev = viewMatrix;
       viewMatrix = CG.matrixMultiply(CG.matrixRotateY(rotation),viewMatrix);
       viewMatrixInverse = CG.matrixInvert(viewMatrix);
    }
 
    // INSERT A BLOB INTO THE ARRAY OF BLOBS
    
    let insertBlob = (nInsert, s) => {
       for (let n = S.length ; n > nInsert ; n--)
          S[n] = S[n-1];
       S[nInsert] = s;
       activeSet(true);
    }
 
    // DELETE A BLOB
    
    let deleteBlob = nDelete => {
       for (let n = nDelete ; n < S.length - 1 ; n++)
          S[n] = S[n+1];
       S.pop();
       mn = findBlob(xPrev, yPrev);
       activeSet(true);
    }
 
    // FIND THE INDEX OF A BLOB WITHIN THE ARRAY OF BLOBS
 
    let findBlobIndex = s => {
       if (s)
          for (let n = 0 ; n < S.length ; n++)
             if (s.id == S[n].id)
                return n;
       return -1;
    }
 
    let findBlobFromID = id => {
       for (let n = 0 ; n < S.length ; n++)
          if (S[n].id == id)
         return S[n];
       return null;
    }
 
    let parent = s => findBlobFromID(s.parentID);
 
    // HANDLE UNDO AND REDO
 
    let undoStack = [], undoStackPointer = 0;
 
    let saveForUndo = () => {
       let S2 = [];
       for (let n = 0 ; n < S.length ; n++)
          S2.push(blobDuplicate(S[n]));
       undoStack[undoStackPointer++] = S2;
    }
 
    let undo = () => {
       if (undoStackPointer > 0) {
          S = undoStack[--undoStackPointer];
          activeSet(true);
       }
    }
 
    let redo = () => {
       if (undoStackPointer < undoStack.length-1) {
          S = undoStack[++undoStackPointer];
          activeSet(true);
       }
    }
 
    // DUPLICATE A BLOB
 
    let blobDuplicate = s => {
       return {
         M: s.M.slice(),
         Q: s.Q.slice(),
         color: s.color,
         id: CG.uniqueID(),
         isBlobby: s.isBlobby,
         isColored: s.isColored,
         rounded: s.rounded,
         sign: s.sign,
         symmetry: s.symmetry,
         type: s.type,
       };
    }
 
    // COMPUTE THE MATRIX DESCRIBING A BLOB'S INITIAL POSITION/SCALE
 
    let computeMatrix = s => {
       let C = CG.mix(s.A, s.B, 0.5),
           R = [ Math.abs(s.A[0] - s.B[0]) / 2,
                 Math.abs(s.A[1] - s.B[1]) / 2,
                 Math.abs(s.A[2] - s.B[2]) / 2 ];
       s.M = [ R[0], 0   , 0   , 0 ,
               0   , R[1], 0   , 0 ,
               0   , 0   , R[2], 0 ,
               C[0], C[1], C[2], 1 ];
       s.M = CG.matrixMultiply(viewMatrixInverse, s.M);
       computeQuadric(s);
    }
 
    // COMPUTE THE QUADRIC EQUATION FOR RAY TRACING TO A BLOB
    
    let computeQuadric = s => {
       let IM = CG.matrixInvert(s.M);
       s.Q = CG.matrixMultiply(CG.matrixTranspose(IM),
                             CG.matrixMultiply([1, 0, 0, 0,
                                              0, 1, 0, 0,
                                              0, 0, 1, 0,
                                              0, 0, 0,-1], IM));
    }
 
    // RAY TRACE TO A BLOB
    
    let raytraceToQuadric = (Q,p,u) => {
       let A = CG.dot(u, CG.matrixTransform(Q, u)),
           B = CG.dot(u, CG.matrixTransform(Q, p)),
           C = CG.dot(p, CG.matrixTransform(Q, p)),
           D = B*B - A*C;
       return D < 0 ? 10000 : (-B - Math.sqrt(D)) / A;
    }
 
    // FIND WHICH BLOB IS VISIBLE AT A GIVEN PIXEL
    
    let findBlob = (x,y) => {
       let p = CG.matrixTransform(viewMatrixInverse, [0,0,fl,1]);
       let u = CG.matrixTransform(viewMatrixInverse, CG.normalize([x,y,-fl,0]));
       let tMin = 1000, nMin = -1;
       for (let n = 0 ; n < S.length ; n++) {
          let t = raytraceToQuadric(S[n].Q, p, u);
          if (t < tMin) {
             tMin = t;
             nMin = n;
          }
       }
       return nMin;
    }
 
    // GET THE DISTANCE TO THE BLOB AT A PIXEL
 
    let blobZ = (n, x,y) => {
       let p = [0,0,fl,1];
       let u = CG.normalize([x,y,-fl,0]);
       let t = raytraceToQuadric(S[n].Q, p, u);
       return p[2] + t * u[2];
    }
 
    let rotateAboutJoint = nn => {
       let rotateAboutPoint = (nn, rot, p) => {
          let s = S[nn];
          move(s,-p[0],-p[1],-p[2]);
          s.M = CG.matrixMultiply(rot, s.M);
          move(s, p[0], p[1], p[2]);
          for (let n = 0 ; n < S.length ; n++)
             if (S[n].parentID == s.id)
                rotateAboutPoint(n, rot, p);
       }
       let p = CG.matrixTransform(S[nn].M, S[nn].jointPosition);
       rotateAboutPoint(nn, S[nn].jointRotation, p);
    }
 
    let move = (s,x,y,z) => { s.M[12]+=x; s.M[13]+=y; s.M[14]+=z; }
 
    // MOVE, ROTATE OR SCALE A BLOB
 
    let xfBlob = (s, matrix, x,y,z, isTransformingChildren) => {
       move(s,-x,-y,-z);
       s.M = CG.matrixMultiply(viewMatrix        , s.M);
       s.M = CG.matrixMultiply(matrix            , s.M);
       s.M = CG.matrixMultiply(viewMatrixInverse , s.M);
       move(s, x, y, z);
       if (isTransformingChildren)
          for (let i = 0 ; i < S.length ; i++)
             if (S[i].parentID == s.id)
                xfBlob(S[i], matrix, x,y,z, true);
    }
 
    let transformBlob = (n, x,y,z) => {
       let s = S[n];
       activeSet(true);
       let mx = s.M[12], my = s.M[13], mz = s.M[14];
       if (isScaling)
          xfBlob(s,
             CG.matrixScale(1+x, 1+y, 1+z),
             mx,my,mz,
             isPressed);
       if (isRotating)
          xfBlob(s,
             CG.matrixMultiply(CG.matrixRotateX(-y), CG.matrixRotateY( x)),
             mx,my,mz,
             isPressed);
       if (isTranslating) {
          let v = viewMatrixInverse;
          s.M[12] += v[ 0] * x + v[ 4] * y + v[ 8] * z;
          s.M[13] += v[ 1] * x + v[ 5] * y + v[ 9] * z;
          s.M[14] += v[ 2] * x + v[ 6] * y + v[10] * z;
          if (! isRubber && s.isBlobby) {
             let b = implicitSurface.bounds();
             let bn = b[n];
             for (let i = 0 ; i < S.length ; i++) {
                if (S[i].isBlobby) {
                   let bi = b[i];
                   if (bi[0][0] < bn[0][0] && bi[0][1] > bn[0][1] &&
                       bi[1][0] < bn[1][0] && bi[1][1] > bn[1][1]) {
                      s.M[14] = blobZ(i, xPrev, yPrev);
                      break;
                   }
                }
             }
          }
      if (isPressed)
             for (let i = 0 ; i < S.length ; i++)
            if (S[i].parentID == s.id)
               if (isDraggingFromCenter || S[i].symmetry < 2)
                  transform2(i, x,y,z);
       }
       computeQuadric(s);
    }
 
    let isDraggingFromCenter = false;
 
    let I = n => S[n].symmetry==2 ? n-1 : n;
    
    let transform = (n, dx, dy, dz) => {
       isDraggingFromCenter = isPressed && S[n].symmetry == 0;
       if (isDraggingFromCenter)
          for (let i = 0 ; i < S.length ; i++) {
          S[i].saveSymmetry = S[i].symmetry;
          S[i].symmetry = 0;
          }
       transform2(n, dx, dy, dz);
       if (isDraggingFromCenter)
          for (let i = 0 ; i < S.length ; i++)
         S[i].symmetry = S[i].saveSymmetry;
    }
    let transform2 = (n, dx, dy, dz) => {
       let sym = S[n].symmetry ? 1 : 0;
       for (let i = 0 ; i <= sym ; i++) {
          let sgn = isScaling || i == 0 ? 1 : -1;
          if (! isScaling && I(n) == n-1) sgn *= -1;
          let r = rotationState % 2;
          let sx = ! isRotating || i==0 ? 1 : -1;
          transformBlob(I(n)+i, r ?  sx*dx : dx*sgn,
                                r ?  sx*dy : dy,
                                r ? sgn*dz : dz);
       }
    }
 
    // INTERACTION TO CREATE A NEW BLOB
 
    let createBegin = (x,y) => {
         sn = S.length;
         S.push({
           A: [x,y,0],
           B: [x+.01,y+.01,0],
           age: 0,
           color: 'color0',
           id: CG.uniqueID(),
           isBlobby: true,
           isColored: false,
           rounded: true,
           sign: 1,
           symmetry: 0,
           type: 0,
         });
         computeMatrix(S[sn]);
         xPrev = x;
         yPrev = y;
    }
 
    let createDrag = (x,y) => {
         activeSet(true);
         let s = S[sn];
         s.B[0] = x;
         s.B[1] = y;
         if (Math.abs(s.B[0] - s.A[0]) < .01) s.B[0] = s.A[0] + .01;
         if (Math.abs(s.B[1] - s.A[1]) < .01) s.B[1] = s.A[1] + .01;
         let rz = Math.min(Math.abs(s.A[0] - s.B[0]),
                           Math.abs(s.A[1] - s.B[1])) / 2;
         s.A[2] = -rz;
         s.B[2] = +rz;
         computeMatrix(s);
         xyTravel += Math.abs(x - xPrev) + Math.abs(y - yPrev);
         xPrev = x;
         yPrev = y;
    }
 
    let createEnd = () => {
         if (isCentering && S[sn].A[0] * S[sn].B[0] < 0) {
            S[sn].M[12] = 0;
        computeQuadric(S[sn]);
         }
    }
 
    let deleteSelectedBlob = () => {
         if (S.length > 0) {               // DELETE A BLOB
            let n = ns(), sym = S[n].symmetry;
            if (sym == 1) deleteBlob(n+1);
                          deleteBlob(n);
            if (sym == 2) deleteBlob(n-1);
         }
    }
 
    // RESPOND TO MOUSE/CURSOR EVENTS
 
    canvas.onPress = (x,y) => {
      if(window.interactMode == 1) {
         isPressed = true;
         if (! isRotating && ! isScaling)
            isTranslating = true;
         saveForUndo();
         xyTravel = 0;
         sn = findBlob(x,y);
         if (isRubber)
            sn = sn < 0 ? ns() : sn;
   
         xPrev = x;
         yPrev = y;
      }
    }
    
    canvas.onDrag = (x,y) => {
      if(window.interactMode == 1) {
         if (sn >= 0)
         transform(sn, x - xPrev, y - yPrev, 0);

      xyTravel += Math.abs(x - xPrev) + Math.abs(y - yPrev);
      xPrev = x;
      yPrev = y;
      }
    }
 
    let handleJoint = nn => {
       if (nn >= 0) {
          let intersection = (a,b) => {
             return [ [ Math.max(a[0][0],b[0][0]), Math.min(a[0][1],b[0][1]) ],
                      [ Math.max(a[1][0],b[1][0]), Math.min(a[1][1],b[1][1]) ],
                      [ Math.max(a[2][0],b[2][0]), Math.min(a[2][1],b[2][1]) ] ];
          }
          let computeJointPosition = (s, I) => {
             let p = [ (I[0][0] + I[0][1]) / 2,
                       (I[1][0] + I[1][1]) / 2,
                       (I[2][0] + I[2][1]) / 2 ];
             s.jointPosition = CG.matrixTransform(CG.matrixInvert(s.M), p);
          }
          if (S[nn].jointPosition) {                 // REPOSITION EXISTING JOINT
             let b = implicitSurface.bounds();
             let n = findBlobIndex(parent(S[nn]));
             if (n >= 0) {
                let I = intersection(b[n], b[nn]);
                computeJointPosition(S[nn], I);
             }
          }
          else if (S[nn].age++ < 2) {                // CREATE NEW JOINT
             let b = implicitSurface.bounds();
             for (let n = 0 ; n < b.length ; n++) {
                if (n != nn) {
                   let I = intersection(b[nn], b[n]);
                   if ( I[0][0] < I[0][1] &&
                        I[1][0] < I[1][1] &&
                        I[2][0] < I[2][1] ) {
                      computeJointPosition(S[nn], I);
                      S[nn].jointRotation = CG.matrixIdentity();
                      S[nn].parentID = S[n].id;
                      S[n].age = 10;
                      if (S[nn].symmetry)
                 createMirrorJoint(nn);
                      break;
                   }
                }
             }
          }
       }
    }
 
    let createMirrorJoint = n1 => {
       let n2 = S[n1].symmetry==1 ? n1+1 : n1-1,
           s1 = S[n1],
           s2 = S[n2];
       s2.jointPosition = [-s1.jointPosition[0],
                            s1.jointPosition[1],
                            s1.jointPosition[2]];
       s2.parentID = s1.parentID;
       s2.jointRotation = CG.matrixIdentity();
       if (parent(s1).symmetry) {
          let n = findBlobIndex(parent(s1));
          n += parent(s1).symmetry == 1 ? 1 : -1;
          s2.parentID = S[n].id;
       }
    }
 
    canvas.onRelease = (x,y) => {
      if(window.interactMode == 1) {
         handleJoint(sn); // AFTER MOVING A BLOB, ADJUST JOINT POSITION
         activeSet(false);
         isTranslating = isRotating = isScaling = false;
         mn = sn;
         sn = -1;
         isPressed = false;
      }
    }
    
    canvas.onMove = (x,y) => {
      if(window.interactMode == 1) {
         if (isCreating)
         createDrag(x, y);
      else if (mn >= 0 && (isTranslating || isRotating || isScaling))
         transform(mn, x - xPrev, y - yPrev, 0);
      else {
         mn = findBlob(x, y);
         if (mn != mnPrev)
            activeSet(true);
         mnPrev = mn;
      }
      xPrev = x;
      yPrev = y;
      }
    }
 
    // RESPOND TO THE KEYBOARD
 
    let kPrev = -1;
    
    canvas.onKeyPress = k => {
      if(window.interactMode == 1) {
         if (k != kPrev) {
            switch (k) {
        case 8:
           if (isRubber)
              flash = true;
               break;
        }
            let ch = String.fromCharCode(k);
            switch (ch) {
            case 'A':
            case 'B':
            case 'X':
            case 'V':
            case 'Z':
           if (isRubber) {
              flash = true;
              break;
               }
               saveForUndo();
               if (! isCreating) {
                  createBegin(xPrev, yPrev);
                  if (ch == 'X') S[sn].type = 1;
                  if (ch == 'V') S[sn].type = 2;
                  if (ch == 'Z') S[sn].type = 3;
                  if (ch == 'B') S[sn].type = 4;
               }
               isCreating = true;
               break;
            case 'D':
           if (isRubber)
              flash = true;
           break;
            case 'R':
               saveForUndo();
               isRotating = true;
               break;
            case 'S':
               saveForUndo();
               isScaling = true;
               break;
            case 'T':
               saveForUndo();
               isTranslating = true;
               break;
            }
         }
         kPrev = k;
      }
    }
 
    let ns = () => mn >= 0 ? mn : S.length - 1;
 
    canvas.onKeyRelease = k => {
      if(window.interactMode == 1) {
         flash = false;
         kPrev = -1;
   
         isTranslating = isRotating = isScaling = false;
         let ch = String.fromCharCode(k);
   
         // TYPE 0-9 TO SET BLOB COLOR
   
         if (S.length > 0 && ch >= '0' && ch <= '9') {
            saveForUndo();
            let color = 'color' + (k - 48) + (isLightColor ? 'l' : '');
   
            // SET COLOR OVER BACKGROUND TO COLOR ALL UNCOLORED BLOBS.
   
            if (mn < 0) {
               for (let n = 0 ; n < S.length ; n++)
                  if (! S[n].isColored)
                     S[n].color = color;
            }
   
            // SET COLOR OVER A BLOB TO EXPLICITLY COLOR IT.
   
            else {
               let sym = S[ns()].symmetry ? 1 : 0;
               for (let i = 0 ; i <= sym ; i++) {
                  S[I(ns())+i].color = color;
                  S[I(ns())+i].isColored = true;
               }
            }
   
            isLightColor = false;
            return;
         }
      
         switch (k) {
         case 8: // DELETE
            if (isRubber)
           break;
            saveForUndo();
            deleteSelectedBlob();             // DELETE THE SELECTED BLOB
            break;
         case 37: // LEFT ARROW
            rotationState--;                  // ROTATE LEFT
            return;
         case 39: // RIGHT ARROW
            rotationState++;                  // ROTATE RIGHT
            return;
         case 189: // '-'
            saveForUndo();
            if (S.length > 0) {               // MAKE NEGATIVE
               let sym = S[ns()].symmetry ? 1 : 0;
               for (let i = 0 ; i <= sym ; i++)
                  S[I(ns())+i].sign = -S[I(ns())+i].sign;
               activeSet(true);
            }
            break;
         case 190: // '.'
            saveForUndo();
            if (S.length > 0) {               // TOGGLE IS BLOBBY
               let sym = S[ns()].symmetry ? 1 : 0;
               for (let i = 0 ; i <= sym ; i++)
                  S[I(ns())+i].isBlobby = ! S[I(ns())+i].isBlobby;
               activeSet(true);
            }
            break;
         case 191: // '/'
            isRubber = ! isRubber;
            break;
         case 192: // '`'
            isLightColor = ! isLightColor;    // LIGHT COLOR
            break;
         case 219: // '['
            saveForUndo();
            if (S.length > 0)
               transform(ns(), 0,0,-.05);     // AWAY
            break;
         case 220: // '\'
            saveForUndo();
            S = [];                           // NEW: DELETE ALL BLOBS
        isWiggling = false;
            activeSet(true);
            break;
         case 221: // ']'
            saveForUndo();
            if (S.length > 0)
               transform(ns(), 0,0,.05);      // FORWARD
            break;
         }
   
         switch (ch) {
         case 'A':
         case 'B':
         case 'X':
         case 'V':
         case 'Z':
            if (isRubber)
           break;
            createEnd();                      // ADD A BLOB
            handleJoint(sn);
            isCreating = false;
            sn = -1;
            break;
         case 'C':
            if (mn >= 0 && S[mn].M) {
               saveForUndo();
               S[mn].M[12] = 0;               // CENTER BLOB AT CURSOR
               computeQuadric(S[mn]);
            }
            else                              // BUT IF OVER BACKGROUND
               isCentering = ! isCentering;   // TOGGLE CENTERING MODE
            break;
         case 'D':
            if (isRubber)
           break;
            saveForUndo();
            deleteSelectedBlob();
            break;
         case 'E':
            if (S.length > 0) {               // BLUR EDGES
               saveForUndo();
               S[ns()].rounded = ! S[ns()].rounded;
               activeSet(true);
            }
            break;
         case 'F':
            isFaceted = ! isFaceted;
            break;
         case 'I':
            redo();
            break;
         case 'J':
            isShowingJoints = ! isShowingJoints;
            break;
         case 'K':
            isShowingBounds = ! isShowingBounds;
            break;
         case 'M':
            if (S.length > 0) {               // CHANGE MIRROR SYMMETRY
               saveForUndo();
               let n1 = ns(),
                   s1 = S[n1];
               switch (s1.symmetry) {
               case 0:                            // CREATE MIRROR SYMMETRY
                  s1.symmetry = 1;
                  let s2 = {
                     M: s1.M.slice(),
                     color: s1.color,
                     id: CG.uniqueID(),
                     isBlobby: s1.isBlobby,
                     isColored: s1.isColored,
             rounded: s1.rounded,
                     sign: s1.sign,
                     symmetry: 2,
                     type: s1.type,
                  };
                  s2.M[12] = -s1.M[12];
                  computeQuadric(s2);
                  insertBlob(n1+1, s2);
                  if (s1.jointPosition)
                     createMirrorJoint(n1);
                  break;
               case 1:                            // REMOVE MIRROR SYMMETRY
                  s1.symmetry = 0;
                  deleteBlob(n1+1);
                  break;
               case 2:
                  s1.symmetry = 0;
                  deleteBlob(n1-1);
                  break;
               }
            }
            break;
         // case 'O':
         //    projectManager.clearNames();         // CLEAR PROJECT NAMES
         //    activeSet(true);
         //    break;
         // case 'P':
         //    projectManager.choice(loadFunction); // USER CHOOSES PROJECT
         //    break;
         case 'R':       // AFTER MOVING A BLOB, ADJUST JOINT POSITIONS
         case 'S':
         case 'T':
            if (mn >= 0) {
               handleJoint(mn);
           for (let n = 0 ; n < S.length ; n++)
              if (S[n].parentID == S[mn].id)
                     handleJoint(n);
            }
            break;
         case 'U':
            undo();
            break;
         case 'W':
            isWiggling = ! isWiggling;
            break;
         }
      }
    }
 }
 
 