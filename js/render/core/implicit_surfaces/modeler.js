import { CG, Matrix } from "../CG.js";
import { ImplicitSurface } from "./implicitSurface.js";
import { materials } from "./materials.js";
import { ProjectManager } from "./projectManager.js";
import { Noise } from "./noise.js";
import { addEventListenersToCanvas } from "./eventListener.js";
import { VERTEX_SIZE, VERTEX_WTS } from "./geometry.js";
import { squareMesh,cubeMesh,sphereMesh,tubeMesh,cylinderMesh } from "./geometry.js";

let ImplicitSurfacesPgm = function () {
   this.program = null;
   this.vao = null;
   this.buffer = null;
   this.opacity = 1;
   this.noisy = 0;
   this.blobby = 1;
   this.phongData = null;
   this.matrixData = null;
   this.invMatrixData = null;
   this.mesh = null;
   this.color = null;
   this.M = CG.matrixIdentity();
   this.initBuffer = (gl) => {
   this.buffer = gl.createBuffer();
   };
   this.initVAO = (gl) => {
   this.vao = gl.createVertexArray();
   };

   this.assignValues = (opacity, noisy, blobby, phongData, matrixData, invMatrixData, mesh, color, M) => {
       this.opacity = opacity;
       this.noisy = noisy;
       this.blobby = blobby;
       this.phongData = phongData;
       this.matrixData = matrixData;
       this.invMatrixData = invMatrixData;
       this.mesh = mesh;
       this.color = color;
       this.M = M;
   }

   this.assignMeshValues = (mesh, materialId, isTriangleMesh, M) => {
      this.M = M;
      this.mesh = mesh;
      this.materialId = materialId;
      this.isTriangleMesh = isTriangleMesh;
   }
};

export function Modeler(gl) {
   this.gl = gl;
   let canvas = gl.canvas;
   let M = new Matrix();
   let S = [];
   let activeCount = -1;
   let blinkTime = 0;
   let blur = 0.2;
   let cursor = [0,0,0];
   let defaultColor = 'color0';
   let fl = 2;                                                          // CAMERA FOCAL LENGTH
   let flash = false;
   let frameCount = 0;
   let id = '';
   let isCentering = false;
   let isClick = false;
   let isControl = false;
   let isCreating = false;
   let isExperiment = false, wasExperiment = false;
   let isFaceted = false;
   let isLengthening = false;
   let isLightColor = false;
   let isPressed = false;
   let isRoom = false;
   let isRotatedView = false;
   let isRotating = false;
   let isRubber = false, toRubber = false;
   let isScaling = false;
   let isShakyCam = false;
   let isShift = false;
   let isSlideshow = true;
   let isTranslating = false;
   let isUniformScaling = false;
   let isShowingBounds = false;
   let isShowingJoints = false;
   let isTextureSrc = false;
   let isWalking = false, walkFactor = 0;
   let isWiggling = false, wiggleFactor = 0;
   let keyPressed = -1, keyChar;
   let scene = [], modelIndex = 0;
   let mn = -1, mnPrev = -1;
   let noise = new Noise();
   let noiseState = 0;
   let projectManager = new ProjectManager();
   let rotatex = 0, rotatexState = 0;
   let rotatey = 0, rotateyState = 0;
   let startTime = Date.now(), time, prevTime = startTime, fps = 10;    // TO TRACK FRAME RATE
   let modelMatrix = CG.matrixIdentity();
   let modelMatrixInverse = CG.matrixInvert(modelMatrix);
   let xPrev, yPrev, xyTravel;
   let xPress, yPress;
   let viewMatrix = CG.matrixIdentity();
   let viewMatrixInverse = CG.matrixInvert(viewMatrix);
   let vm = CG.matrixIdentity(), vmi = CG.matrixIdentity();

   // HANDLE SETTING WHETHER THE MODEL IS ACTIVELY CHANGING

   let activeSet   = isActive => activeCount = isActive ? 4 : -1;
   let activeState = () => activeCount >= 0;
   let activeTimer = () => activeCount--;
   this.implicitSurfacesPgm = new ImplicitSurfacesPgm();
   let pgm = null;
   let implicitSurface = new ImplicitSurface(M, gl, pgm);

   addEventListenersToCanvas(canvas);

   let setUniform = (type, name, a, b, c, d, e, f) => {
      let loc = gl.getUniformLocation(window.modeler.implicitSurfacesPgm.program.program, name);
      (gl['uniform' + type])(loc, a, b, c, d, e, f);
   }

   let drawMesh = (mesh, materialId, isTriangleMesh, textureSrc) => {
      let m = M.value();
      setUniform('Matrix4fv', 'uMatrix', false, m);
      setUniform('Matrix4fv', 'uInvMatrix', false, CG.matrixInvert(m));
   
      let material = materials[materialId];
      let a = material.ambient, d = material.diffuse, s = material.specular, t = material.texture;
      if (t === undefined) t = [0,0,0,0];
      setUniform('Matrix4fv', 'uPhong', false, [a[0],a[1],a[2],0, d[0],d[1],d[2],0, s[0],s[1],s[2],s[3], t[0],t[1],t[2],t[3]]);
   
      if (textureSrc) {
         if (! textures[textureSrc]) {                  // LOAD THE TEXTURE IF IT HAS NOT BEEN LOADED.
            let image = new Image();
            image.onload = function(event) {
          try {
                  textures[this.textureSrc] = gl.createTexture();
                  gl.bindTexture   (gl.TEXTURE_2D, textures[this.textureSrc]);
                  gl.texImage2D    (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
                  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                  gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                  gl.generateMipmap(gl.TEXTURE_2D);
               } catch (e) { textures[textureSrc + '_error'] = true; }
            }
            image.textureSrc = textureSrc;
            image.src = textureSrc;
         }
         else {                                         // IF TEXTURE IS LOADED, TELL THE GPU ABOUT IT.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[textureSrc]);
         }
      }
      setUniform('1i', 'uSampler', 0);                            // SPECIFY TEXTURE INDEX.
      setUniform('1f', 'uTexture', isTexture(textureSrc)? 1 : 0); // ARE WE RENDERING A TEXTURE?
   
      gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
      gl.drawArrays(isTriangleMesh ? gl.TRIANGLES : gl.TRIANGLE_STRIP, 0, mesh.length / VERTEX_SIZE);
   }

   let updatePgm = () => {
      pgm = window.modeler.implicitSurfacesPgm.program;
   }
 
   // HANDLE LOADING AND SAVING

   let scene_to_load = null;

   let loadFunction = arg => scene_to_load = arg;

   let saveFunction = () => {
      scene[modelIndex] = {
         S         : S,
         isRubber  : isRubber,
         isWalking : isWalking,
         isWiggling: isWiggling,
         noiseState: noiseState,
      };
      return scene;
   }

   // DRAW ROUTINE THAT ALLOWS CUSTOM COLORS, TEXTURES AND TRANSFORMATIONS

   let draw = (mesh,color,texture,move,turn,size) => {
      // fl = 1/window.views[0].projectionMatrix[0];
      // IF color IS A STRING LIKE "100,120,80", THEN CREATE A NEW MATERIAL.

      if (! materials[color]) {
         let rgb = color.split(',');
         let r = parseInt(rgb[0]) / 255,
             g = parseInt(rgb[1]) / 255,
             b = parseInt(rgb[2]) / 255;
         materials[color] = { ambient: [.2*r ,.2*g ,.2*b ],
                              diffuse: [.8*r ,.8*g ,.8*b ],
                              specular: [.9,.9,.9,20] };
      }

      // TRANSFORM BEFORE DRAWING IF ANY TRANSLATE, ROTATE OR SCALE ARGS.

      if (move || turn || size)
         M.save();

      if (move)
         M.translate(move);
      if (turn) {
         M.rotateX(turn[0]);
         M.rotateY(turn[1]);
         M.rotateZ(turn[2]);
      }
      if (size)
         M.scale(...size);

      drawMesh(mesh, color, false, texture);

      if (move || turn || size)
         M.restore();
   }

   let cursorTransform = (x,y) => CG.matrixTransform(viewMatrixInverse, [x, y, 0]);

   // ANIMATE AND RENDER ONE FRAME

   this.setModel = index => {
      modelIndex = index;
      let model  = scene[index];
      id         = model.id;
      S          = model.S;
      isRubber   = false;
      toRubber   = model.isRubber;
      isWalking  = model.isWalking;
      isWiggling = model.isWiggling;
      noiseState = model.noiseState;
      activeSet(true);
   }

   this.animate = gl => {
      updatePgm();
      implicitSurface.updatePgm(window.modeler.implicitSurfacesPgm.program);
      // if (window.bgWindow)
      //    bgWindow.style.left = flash ? -screen.width : 0;

      // HANDLE LOADING A NEW SCENE

      if (scene_to_load) {
         scene = scene_to_load;
         scene_to_load = null;
	 this.setModel(1);
      }

      // HANDLE FETCHING AND UPDATING THE CURRENT PROJECT

      if (frameCount == 0) {
         projectManager.load(loadFunction);
         setUniform('1f', 'uAspectRatio', canvas.width / canvas.height);
        //  slideshow.setVisible(isSlideshow);
      }

      // if (frameCount % 100 == 99)
      //    projectManager.save(saveFunction());

      frameCount++;

      // SET ALL UNIFORM VARIABLES ON THE GPU
   
      time = (Date.now() - startTime) / 1000;
      setUniform('1f', 'uTime', time);                                  // SET GPU TIME
      let elapsed = time - prevTime;
      fps = .1 * fps + .9 / elapsed;
      prevTime = time;
   
      setUniform('1f', 'uOpacity', 1);
      // let r3 = Math.sqrt(1/3);
      // setUniform('3fv', 'uLDir', [r3,r3,r3, -r3,-r3,-r3]);              // SET GPU LIGHTS
      // setUniform('3fv', 'uLCol', [.6,.8,1, .4,.3,.2]);
      setUniform('Matrix4fv', 'uPerspective', false, CG.matrixPerspective(fl)); // SET GPU CAMERA M.save();
      viewMatrix = window.views[0].viewMatrix;
      M.set(window.views[0].viewMatrix);
      // M.scale(0.95);
      M.translate(0,1.5,0);
      // HANDLE EXPERIMENTS

      M.translate(0,0,.5);

      if (isExperiment) {
         let rMinSave = rMin;
         rMin = .02;
         let x = -.9, y = 0, z = 0;
         for (let i = 0 ; i < 100 ; i++) {
            let theta = Math.sin(i/4);
            let dx = .03 * Math.cos(theta);
            let dy = .03 * Math.sin(theta);
            createBegin(x,y);
            createDrag(x+dx,y+dy);
            x += dx * .8;
            y += dy * .8;
         }
         rMin = rMinSave;
      }
      isExperiment = false;

      M.save();

      // TEST ANIMATING THE CAMERA VIEW

      // if (isShakyCam) {
      //    M.translate(1. * noise.noise(time/2, 10, 0),
      //                .5 * noise.noise(time/2, 20, 0),
      //                1. * noise.noise(time/2, 30, 0));
      //    M.rotateY  (.6 * noise.noise(time/2, 40, 0));
      //    M.rotateX  (.1 * noise.noise(time/2, 50, 0));
      // }
      // else if (isRotatedView) {
      //    M.translate(.2,.2,.2);
      //    M.rotateX(.5);
      //    M.rotateY(1);
      // }
      viewMatrix = M.value();
      viewMatrixInverse = CG.matrixInvert(viewMatrix);

      // OPTIONALLY DRAW THE ROOM

      if (isRoom) {
         let D = 21;
         M.save();
            M.translate(0,.1,0);
            M.scale(.4);
            draw(squareMesh, '90,90,100'  , null, [  0   ,  -6,-D/2 ], [Math.PI/2,0,0], [2*D,D,.01]);
            draw(squareMesh, '60,20,10'   , null, [  0   , 7  ,-D/2 ], [Math.PI/2,0,0], [2*D,D/2,.01]);
            draw(squareMesh, '40,35,35'   , null, [  0   , 0  ,-D-.1], null, [2*D  ,D    ,.01]);
            draw(squareMesh, '200,150,120', null, [  0   ,-.95,-D   ], null, [  .3 , 5.05,.01]);
            draw(squareMesh, '200,150,120', null, [  0   , 4.1,-D   ], null, [11.7,   .15,.01]);
            draw(squareMesh, '200,150,120', null, [  5.2 ,-.95,-D   ], null, [  .1 , 5.05,.01]);
            draw(squareMesh, '200,150,120', null, [ -5.2 ,-.95,-D   ], null, [  .1 , 5.05,.01]);
            draw(squareMesh, ' 50, 30, 20', null, [  8.37,-4.7,-D+.1], null, [ 3.08, 1.9 ,.02]);
            draw(squareMesh, ' 50, 30, 20', null, [ -8.37,-4.7,-D+.1], null, [ 3.08, 1.9 ,.02]);
            draw(squareMesh, '200,150,120', null, [ 11.4 ,-.95,-D   ], null, [  .09, 5.05,.01]);
            draw(squareMesh, '200,150,120', null, [ 11.6 ,-.95,-D   ], null, [  .09, 5.05,.01]);
            draw(squareMesh, '200,150,120', null, [-11.4 ,-.95,-D   ], null, [  .09, 5.05,.01]);
            draw(squareMesh, '200,150,120', null, [-11.6 ,-.95,-D   ], null, [  .09, 5.05,.01]);
         M.restore();
      }

      // DRAW THE CURSOR

      let cp = CG.mix(cursorTransform(xPrev,yPrev),
                   CG.matrixTransform(viewMatrixInverse, [0,0,fl]), .5);
      draw(sphereMesh, 'trueBlack', null, cp, null, [.01,.01,.01]);

      // DRAW THE TABLE

      M.save();
         draw(cubeMesh, 'color8', null, [0,-1.03,0], null, [1,.03,1]);
         draw(tubeMesh, 'color8', null, [0,-2.35,0], [Math.PI/2,0,0], [.1,.1,1.35]);
      M.restore();

      // SHOW CENTERING INDICATOR

      if (! isRubber && isCentering)
         draw(cubeMesh, 'black', null, null, null, [.0025,2,.0025]);

      // SET IMPLICIT SURFACE PROPERTIES
   
      implicitSurface.setBlobby(true);
      implicitSurface.setBlur(blur);
      implicitSurface.setDivs(noiseState==2 ? 50 : isRubber ? 100 : activeState() ? 50 : 100);
      implicitSurface.setFaceted(isFaceted);
      implicitSurface.setNoise(noiseState);
      implicitSurface.setTexture(isTextureSrc ? 'images/frl_texture.jpg' : '');

      // ADVANCE THE "ACTIVE REMESHING" TIMER

      activeTimer();

      // SAVE MATRICES BEFORE DOING ANY JOINT ROTATION

      for (let n = 0 ; n < S.length ; n++)
         S[n].M_save = S[n].M.slice();

      // HANDLE WIGGLING ANIMATION

      wiggleFactor = Math.max(0, Math.min(1, wiggleFactor + (isWiggling ? .03 : -.03)));
      if (S.length > 0 && wiggleFactor > 0) {
         let w = .1 * wiggleFactor;
         let wiggleRot = n =>
            CG.matrixMultiply(
            CG.matrixMultiply(CG.matrixRotateX(w * Math.sin(8 * time + S[n].id * 10)),
                              CG.matrixRotateY(w * Math.sin(8 * time + S[n].id * 20))),
                              CG.matrixRotateZ(w * Math.sin(8 * time + S[n].id * 30)));
         rotateAboutPoint(0, wiggleRot(0), S[0].M.slice(12,15));
         for (let n = 0 ; n < S.length ; n++)
            if (S[n].jointPosition) {
               S[n].jointRotation = wiggleRot(n);
               rotateAboutJoint(n);
            }
      }

      // HANDLE PROCEDURAL WALKING ANIMATION

      walkFactor = Math.max(0, Math.min(1, walkFactor + (isWalking ? .06 : -.06)));
      if (S.length > 0 && walkFactor > 0) {

         let bird = ! hasPart('left_upper_leg') || hasPart('right_lower_arm') && ! hasPart('right_hand');
         let w = CG.sCurve(walkFactor) * .7;
         let tR = bird ? 8 * time : 4 * time;
         let tL = tR + Math.PI;

         let blink = time > blinkTime - .1;
         if (time > blinkTime)
            blinkTime = time + 1 + 5 * Math.random();
 
         let walkRot = n => {
            let mm = CG.matrixMultiply, rx = CG.matrixRotateX, ry = CG.matrixRotateY, rz = CG.matrixRotateZ;
            let cos = Math.cos, sin = Math.sin;
            let m = CG.matrixIdentity();
            switch (S[n].name) {
            case 'belly': m = mm(CG.matrixTranslate(0, w * (bird ? .05 : -.05) * sin(2 * tR), 0), rz(w * .1 * cos(tR))); break;
            case 'chest': m = mm(rz(w * -.13 * cos(tR)), rx(w * -.05 * cos(2 * tR))); break;
            case 'head' : m = mm(rx(w *  .03 * cos(2 * tR)), rz(w *  .1  * cos(tR))); break;

            case 'right_eye': m = blink ? CG.matrixTranslate(0,1000,0) : m; break;
            case 'left_eye' : m = blink ? CG.matrixTranslate(0,1000,0) : m; break;

            case 'right_upper_arm': m = mm(ry(bird ? 0 : w *  (cos(tR)-.5)/2), rz(bird ? w* (cos(2*tR)+1)/4 :  w)); break;
            case 'left_upper_arm' : m = mm(ry(bird ? 0 : w * -(cos(tL)-.5)/2), rz(bird ? w*-(cos(2*tL)+1)/4 : -w)); break;

            case 'right_lower_arm': m = mm(rx(bird ? 0 : w * (-sin(tR)-1)/2), rz(bird ?  sin(2*tR)/8 :  w)); break;
            case 'left_lower_arm' : m = mm(rx(bird ? 0 : w * (-sin(tL)-1)/2), rz(bird ? -sin(2*tL)/8 : -w)); break;

            case 'right_hand'     : m = rx(w * -sin(tR)/4); break;
            case 'left_hand'      : m = rx(w * -cos(tR)/4); break;

            case 'right_upper_leg': m = mm(rz(w* .05 * (sin(tR)-.5)), rx(w*(bird ? -cos(tR)+1.5 : 1.5*cos(tR)-.5)/2)); break;
            case 'left_upper_leg' : m = mm(rz(w*-.05 * (sin(tL)+.5)), rx(w*(bird ? -cos(tL)+1.5 : 1.5*cos(tL)-.5)/2)); break;

            case 'right_lower_leg': m = rx(w * (bird ? sin(tR) - 1 : (sin(tR) + 1)*1.5)); break;
            case 'left_lower_leg' : m = rx(w * (bird ? sin(tL) - 1 : (sin(tL) + 1)*1.5)); break;

            case 'right_foot'     : m = rx(w * (bird ? cos(tR)/2 - sin(tR)/2 : -cos(tR)/2)); break;
            case 'left_foot'      : m = rx(w * (bird ? cos(tL)/2 - sin(tL)/2 : -cos(tL)/2)); break;
            }
            return m;
         }
         rotateAboutPoint(0, walkRot(0), S[0].M.slice(12,15));
         for (let n = 0 ; n < S.length ; n++)
            if (S[n].jointPosition) {
               S[n].jointRotation = walkRot(n);
               rotateAboutJoint(n);
            }
      }

      // DRAW THE MODEL
   
      implicitSurface.beginBlobs();

      // SHOW JOINTS IF IN JOINT SHOWING MODE

      if (isShowingJoints) {

         let linkCount = 0;

         let drawLink = (p1, p2, r) => {       // DRAW A LINK BETWEEEN TWO JOINTS
            M.save();
               M.set(vm);
               M.translate(CG.mix(p1, p2, 0.5));
               let dp = [p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]];
               M.aimZ(dp);
               M.scale(r,r,CG.norm(dp) / 2);
               draw(tubeMesh, 'white');
            M.restore();
            linkCount++;
         }

         for (let n = 0 ; n < S.length ; n++) {
            let s = S[n];
            if (s.jointPosition) {

               // SHOW JOINT

               M.save();
                  M.set(CG.matrixMultiply(vm, s.M));
                  M.translate(s.jointPosition);
                  let sc = i => .02 / CG.norm(M.value().slice(4*i,4*i+3));
                  M.scale(sc(0), sc(1), sc(2));
                  draw(sphereMesh, 'white');
               M.restore();

               // CONNECT PARENT AND CHILD JOINT

               if (parent(s) && parent(s).jointPosition)
                  drawLink(CG.matrixTransform(parent(s).M, parent(s).jointPosition),
                           CG.matrixTransform(s.M, s.jointPosition), .01);
            }

            // CONNECT TOGETHER THE CHILD JOINTS OF FIRST BLOB

            if (n == 0) {
               let P = [];
               for (let i = 0 ; i < S.length ; i++)
                  if (S[i].parentID == s.id)
                     P.push(CG.matrixTransform(S[i].M, S[i].jointPosition));
               for (let j = 0 ; j < P.length ; j++)
                  drawLink(P[j], P[(j + 1) % P.length], .005);
            }
         }
      }

      let ethane = id == 'ethane';
      let rm = CG.matrixMultiply(CG.matrixRotateY(ethane ? -2*time : -1.1*time + .03 * Math.sin(6*time)),
               CG.matrixMultiply(CG.matrixTranslate(ethane ? 0 : .7,-.5,0),
                                 CG.matrixScale(ethane ? .8 : .5)));
      if (ethane)
         rm = CG.matrixMultiply(CG.matrixTranslate(0,0,.5), rm);

      // SPECIFY THE BLOBS FOR THE MODEL
   
      for (let n = 0 ; n < S.length ; n++) {
         M.save();

            let materialId = S[n].color;
            let m = materials[materialId];
            m.specular = isRubber ? [0,0,0,20] : [.4,.4,.4,8];

            // ADD TO ARRAY OF BLOBS

            implicitSurface.addBlob(
               S[n].type==4 ? implicitSurface.CUBE :
               S[n].type==3 ? implicitSurface.CYLINDERZ :
               S[n].type==2 ? implicitSurface.CYLINDERY :
               S[n].type==1 ? implicitSurface.CYLINDERX :
                              implicitSurface.SPHERE,
               S[n].rounded,
               S[n].M,
               materialId,
               S[n].isBlobby ? S[n].sign : 0,
               n==mn);

            // IF NOT IN BLOBBY MODE, DRAW THE SHAPE

            if (! S[n].isBlobby) {
               let m = materials[materialId];
               m.specular = [.9,.9,.9,30];
               if (n == mn)
                  m.texture = [.5,0,0,0];
               M.save();
                  let sm = CG.matrixMultiply(vm, rm);
                  M.set(CG.matrixMultiply(sm, S[n].M));
                  if (S[n].type == 1) M.rotateY(Math.PI/2);
                  if (S[n].type == 2) M.rotateX(Math.PI/2);
                  draw(S[n].type==4 ? cubeMesh :
                       S[n].type> 0 ? cylinderMesh :
                                      sphereMesh, materialId);
               M.restore();
               if (m.texture)
                  delete m.texture;
               m.specular = [.1,.1,.1,2];
            }

         M.restore();
      }

      // IF SHOWING JOINTS, MAKE BLOB MODEL TRANSPARENT

      setUniform('1f', 'uNoisy'  , isRubber ? 1 : 0);
      setUniform('1f', 'uOpacity', isShowingJoints ? .3 : 1);
      M.save();
         M.set(vm);
         M.multiply(rm);
         implicitSurface.endBlobs();
      M.restore();
      setUniform('1f', 'uNoisy'  , 0);
      setUniform('1f', 'uOpacity', 1);

      // SHOW VISUAL HINT OF ANY NEGATIVE SHAPES

      if (! isRubber) {
         setUniform('1f', 'uOpacity', .25);
         for (let n = 0 ; n < S.length ; n++)
            if (S[n].sign == -1) {
               M.save();
                  M.set(CG.matrixMultiply(vm, S[n].M));
                  let m = materials[S[n].color],
                      type = S[n].type;
                  if (n == mn)
                     m.texture = [.5,0,0,0];
                  if (type==1) M.rotateY(Math.PI/2);
                  if (type==2) M.rotateX(Math.PI/2);
                  draw(type==0 ? sphereMesh : type< 4 ? cylinderMesh : cubeMesh, S[n].color);
                  if (m.texture)
                     delete m.texture;
               M.restore();
            }
         setUniform('1f', 'uOpacity', 1);
      }

      // OPTIONALLY SHOW BOUNDING BOXES AROUND BLOBS

      if (! isRubber && isShowingBounds) {
         let drawBoundsCube = (b, matrix, t) => {
            let x0 = b[0][0], x1 = b[0][1];
            let y0 = b[1][0], y1 = b[1][1];
            let z0 = b[2][0], z1 = b[2][1];
            M.save();
               M.set(matrix);
               M.translate((x0+x1)/2, (y0+y1)/2, (z0+z1)/2);
               M.scale((x1-x0)/2, (y1-y0)/2, (z1-z0)/2);
               setUniform('1f', 'uOpacity', t ? t : 0.3);
               draw(cubeMesh, 'white');
               setUniform('1f', 'uOpacity', 1);
            M.restore();
         }

         let bounds = implicitSurface.bounds();
         let b = [[100,-100],[100,-100],[100,-100]];
         for (let n = 0 ; n < bounds.length ; n++) {
            drawBoundsCube(bounds[n], vm);
            for (let j = 0 ; j < 3 ; j++) {
               b[j][0] = Math.min(b[j][0], bounds[n][j][0]);
               b[j][1] = Math.max(b[j][1], bounds[n][j][1]);
            }
         }
         drawBoundsCube(b, vm, .1);
         drawBoundsCube([[-1,-.99],[-1,1],[-1,1]], vm, .1);
         drawBoundsCube([[ .99, 1],[-1,1],[-1,1]], vm, .1);
         drawBoundsCube([[-1,1],[-1,-.99],[-1,1]], vm, .1);
         drawBoundsCube([[-1,1],[ .99, 1],[-1,1]], vm, .1);
      }

      M.restore();

      if (isShakyCam)
         findActiveBlob(xPrev, yPrev);

      // POSSIBLY REBUILD THE IMPLICIT SURFACE

      if (noiseState==2 || ! isRubber && activeState() && frameCount % 4 == 0) {
         implicitSurface.remesh();
         if (toRubber) {
            isRubber = true;
            toRubber = false;
         }
      }

      // RESTORE MATRICES TO BEFORE JOINT ROTATIONS

      for (let n = 0 ; n < S.length ; n++)
         S[n].M = S[n].M_save;

      // HANDLE ROTATING THE MODEL
   
      let delta = 2 * elapsed;

      let rotatexTarget = Math.PI / 2 * rotatexState;
      if (rotatex != rotatexTarget) {
         if (rotatex > rotatexTarget) rotatex -= delta;
         if (rotatex < rotatexTarget) rotatex += delta;
         if (Math.abs(rotatex - rotatexTarget) < delta) {
            rotatex = rotatexTarget;
            mn = findBlob(xPrev, yPrev);
         }
      }

      let rotateyTarget = Math.PI / 2 * rotateyState;
      if (rotatey != rotateyTarget) {
         if (rotatey > rotateyTarget) rotatey -= delta;
         if (rotatey < rotateyTarget) rotatey += delta;
         if (Math.abs(rotatey - rotateyTarget) < delta) {
            rotatey = rotateyTarget;
            mn = findBlob(xPrev, yPrev);
         }
      }

      modelMatrix = CG.matrixMultiply(CG.matrixRotateY(rotatey), CG.matrixRotateX(rotatex));
      modelMatrixInverse = CG.matrixInvert(modelMatrix);

      vm  = CG.matrixMultiply(viewMatrix, modelMatrix);
      vmi = CG.matrixMultiply(modelMatrixInverse, viewMatrixInverse);
   }

   // FIND OUT WHETHER THE MODEL HAS A PARTICULAR NAMED PART

   let hasPart = partName => {
      for (let i = 0 ; i < S.length ; i++)
         if (S[i].name === partName)
            return true;
      return false;
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
      let s = S[nDelete];

      for (let n = nDelete ; n < S.length - 1 ; n++)
         S[n] = S[n+1];
      S.pop();

      for (let n = 0 ; n < S.length ; n++)
         if (S[n].parentID == s.id) {
            delete S[n].parentID;
            delete S[n].jointPosition;
         }

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

   let isChildOf = (s, parentName) => {
      let parent = findBlobFromID(s.parentID);
      return parent && parent.name == parentName;
   }

   let parent = s => findBlobFromID(s.parentID);

   // HANDLE UNDO AND REDO

   let undoStack = [], undoStackPointer = -1;

   let saveForUndo = () => {
      if (isCreating)
         createEnd();
      let S2 = [];
      for (let n = 0 ; n < S.length ; n++)
         S2.push(blobDuplicate(S[n]));
      undoStack[++undoStackPointer] = S2;
   }

   let undo = () => {
      saveForUndo();
      undoStackPointer--;
      if (undoStackPointer >= 0) {
         S = undoStack[undoStackPointer--];
         activeSet(true);
      }
      if (undoStackPointer == -1)
         undoStackPointer = 0;
   }

   let redo = () => {
      if (undoStackPointer < undoStack.length-1) {
         S = undoStack[++undoStackPointer];
         activeSet(true);
      }
      if (undoStackPointer == undoStack.length-1)
         undoStackPointer = undoStack.length-2;
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
         jointPosition: s.jointPosition ? s.jointPosition.slice() : null,
         jointRotation: s.jointRotation ? s.jointRotation.slice() : null,
         parentID: s.parentID,
         rounded: s.rounded,
         sign: s.sign,
         symmetry: s.symmetry,
         type: s.type,
      };
   }

   // COMPUTE THE MATRIX DESCRIBING A BLOB'S INITIAL POSITION/SCALE

   let rMin = .05;

   let computeMatrix = s => {
      let C = CG.mix(s.A, s.B, 0.5),
          R = [ Math.max(rMin, Math.abs(s.A[0] - s.B[0]) / 2),
                Math.max(rMin, Math.abs(s.A[1] - s.B[1]) / 2),
                Math.max(rMin, Math.abs(s.A[2] - s.B[2]) / 2) ];
      s.M = [ R[0], 0   , 0   , 0 ,
              0   , R[1], 0   , 0 ,
              0   , 0   , R[2], 0 ,
              C[0], C[1], C[2], 1 ];
      s.M = CG.matrixMultiply(vmi, s.M);
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

   let findActiveBlob = (x, y) => {
      mn = findBlob(x, y);
      if (mn != mnPrev)
         activeSet(true);
      mnPrev = mn;
   }
   
   let findBlob = (x,y) => {
      let p = CG.matrixTransform(vmi, [0,0,fl,1]);
      let u = CG.matrixTransform(vmi, CG.normalize([x,y,-fl,0]));
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

   let rotateAboutPoint = (nn, rot, p) => {
      let s = S[nn];
      move(s,-p[0],-p[1],-p[2]);
      s.M = CG.matrixMultiply(rot, s.M);
      move(s, p[0], p[1], p[2]);
      for (let n = 1 ; n < S.length ; n++)
         if (S[n].parentID == s.id)
            rotateAboutPoint(n, rot, p);
   }

   let rotateAboutJoint = nn => {
      let p = CG.matrixTransform(S[nn].M, S[nn].jointPosition);
      rotateAboutPoint(nn, S[nn].jointRotation, p);
   }

   let move = (s,x,y,z) => { s.M[12]+=x; s.M[13]+=y; s.M[14]+=z; }

   // MOVE, ROTATE OR SCALE A BLOB

   let xfBlob = (s, matrix, x,y,z, isTransformingChildren) => {
      move(s,-x,-y,-z);
      s.M = CG.matrixMultiply(vm    , s.M);
      s.M = CG.matrixMultiply(matrix, s.M);
      s.M = CG.matrixMultiply(vmi   , s.M);
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
      if (isUniformScaling)
         xfBlob(s,
                CG.matrixScale(1+4*y, 1+4*y, 1+4*y),
                mx,my,mz,
                isPressed);
      if (isScaling)
         xfBlob(s,
                CG.matrixScale(1+4*x, 1+4*y, 1+4*z),
                mx,my,mz,
                isPressed);
      if (isRotating)
         xfBlob(s,
                CG.matrixMultiply(CG.matrixRotateX(-y), CG.matrixRotateY( x)),
                mx,my,mz,
                isPressed);
      if (isTranslating) {
         s.M[12] += vmi[0] * x + vmi[4] * y + vmi[ 8] * z;
         s.M[13] += vmi[1] * x + vmi[5] * y + vmi[ 9] * z;
         s.M[14] += vmi[2] * x + vmi[6] * y + vmi[10] * z;
         if (! isRubber && rotatexState % 4 == 0 && rotateyState % 4 == 0 && (n == mn || I(n) == mn)) {
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
         for (let i = 0 ; i < S.length ; i++) {
            S[i].symmetry = S[i].saveSymmetry;
            delete S[i].saveSymmetry;
         }
   }
   let transform2 = (n, dx, dy, dz) => {
      let sym = S[n].symmetry ? 1 : 0;
      for (let i = 0 ; i <= sym ; i++) {
         let sgn = isScaling || isUniformScaling || i == 0 ? 1 : -1;
         if (! isScaling && ! isUniformScaling && I(n) == n-1) sgn *= -1;
         let r = rotateyState % 2;
         let sx = ! isRotating || i==0 ? 1 : -1;
         transformBlob(I(n)+i, r ?  sx*dx : dx*sgn,
                               r ?  sx*dy : dy,
                               r ? sgn*dz : dz);
      }
   }

   let nameBipedParts = () => {
      for (let i = 0 ; i < S.length ; i++)
         if (S[i].name == 'right_foot') {
            for (let n = 0 ; n < S.length ; n++) {
               let s = S[n], m = s.symmetry;
               if (isChildOf(s, 'chest')) s.name = m==0 ? 'head' : m==1 ? 'right_upper_arm' : 'left_upper_arm';
               if (isChildOf(s, 'left_upper_arm' )) s.name = 'left_lower_arm' ;
               if (isChildOf(s, 'right_upper_arm')) s.name = 'right_lower_arm';
               if (isChildOf(s, 'left_upper_arm' )) s.name = 'left_lower_arm' ;
               if (isChildOf(s, 'right_lower_arm')) s.name = 'right_hand';
               if (isChildOf(s, 'left_lower_arm' )) s.name = 'left_hand' ;
            }
            return;
         }

      S[0].name = 'belly';
      for (let n = 1 ; n < S.length ; n++) {
         let s = S[n], m = s.symmetry;
         if      (isChildOf(s, 'belly')) s.name = m==0 ? 'chest' : m==1 ? 'right_upper_leg' : 'left_upper_leg';
         else if (isChildOf(s, 'chest')) s.name = m==0 ? 'head'  : m==1 ? 'right_upper_arm' : 'left_upper_arm';
         else if (isChildOf(s, 'head' )) s.name = m==0 ? 'nose'  : m==1 ? 'right_eye'       : 'left_eye'      ;
         else if (isChildOf(s, 'right_upper_leg')) s.name = 'right_lower_leg';
         else if (isChildOf(s, 'right_lower_leg')) s.name = 'right_foot'     ;
         else if (isChildOf(s, 'right_upper_arm')) s.name = 'right_lower_arm';
         else if (isChildOf(s, 'right_lower_arm')) s.name = 'right_hand'     ;
         else if (isChildOf(s, 'left_upper_leg' )) s.name = 'left_lower_leg' ;
         else if (isChildOf(s, 'left_lower_leg' )) s.name = 'left_foot'      ;
         else if (isChildOf(s, 'left_upper_arm' )) s.name = 'left_lower_arm' ;
         else if (isChildOf(s, 'left_lower_arm' )) s.name = 'left_hand'      ;
      }
   }

   // INTERACTION TO CREATE A NEW BLOB

   let createBegin = (x,y) => {
      mn = S.length;
      S.push({
         A: [x,y,0],
         B: [x+.01,y+.01,0],
         color: defaultColor,
         id: CG.uniqueID(),
         isBlobby: true,
         isColored: false,
         rounded: false,
         sign: 1,
         symmetry: 0,
         type: 0,
      });
      computeMatrix(S[mn]);
      xPrev = x;
      yPrev = y;
   }

   let createDrag = (x,y) => {
      activeSet(true);
      let s = S[mn];

      if (!s || ! s.B) {
         mn = -1;
         keyChar = null;
         return;
      }

      s.B[0] = x;
      s.B[1] = y;
      let rz = Math.max(rMin, Math.min(Math.abs(s.A[0] - s.B[0]),
                                       Math.abs(s.A[1] - s.B[1])) / 2);
      s.A[2] = -rz;
      s.B[2] = +rz;

// We need to transform here so that mouse movement makes changes in view coords.

      computeMatrix(s);
      xyTravel += Math.abs(x - xPrev) + Math.abs(y - yPrev);
      xPrev = x;
      yPrev = y;
   }

   let createEnd = () => {
      if (isCentering && S.length > 0 && S[mn].A[0] * S[mn].B[0] < 0) {
         S[mn].M[12] = 0;
         computeQuadric(S[mn]);
      }
      handleJoint(mn);
      isCreating = false;
      mn = -1;
   }

   let deleteSelectedBlob = () => {
      if (S.length > 0) {               // DELETE A BLOB
         let n = ns(), sym = S[n].symmetry;
         if (sym == 1) deleteBlob(n+1);
                       deleteBlob(n);
         if (sym == 2) deleteBlob(n-1);
      }
   }

   // HELPER FUNCTIONS FOR RESPONDING TO MOUSE/CURSOR EVENTS

   let handleJoint = nn => {
      if (nn >= 1) {
         let intersection = (a,b) => {
            return [ [ Math.max(a[0][0],b[0][0]), Math.min(a[0][1],b[0][1]) ],
                     [ Math.max(a[1][0],b[1][0]), Math.min(a[1][1],b[1][1]) ],
                     [ Math.max(a[2][0],b[2][0]), Math.min(a[2][1],b[2][1]) ] ];
         }
         let computeJointPosition = (s, I) =>
            s.jointPosition = CG.matrixTransform(CG.matrixInvert(s.M), [ (I[0][0] + I[0][1]) / 2,
                                                                      (I[1][0] + I[1][1]) / 2,
                                                                      (I[2][0] + I[2][1]) / 2 ]);

         if (S[nn].parentID) {                          // REPOSITION EXISTING JOINT
            let b = implicitSurface.bounds();
            let n = findBlobIndex(parent(S[nn]));
            if (n >= 0) {
               let I = intersection(b[n], b[nn]);
               computeJointPosition(S[nn], I);
               if (S[nn].symmetry) {
                  let nn2 = S[nn].symmetry==1 ? nn+1 : nn-1;
                  let n2 = findBlobIndex(parent(S[nn2]));
                  let I = intersection(b[n2], b[nn2]);
                  computeJointPosition(S[nn2], I);
               }
            }
         }
         else {                                         // CREATE NEW JOINT
            let b = implicitSurface.bounds();
            for (let n = 0 ; n < b.length ; n++) {
               if (n != nn) {
                  let I = intersection(b[nn], b[n]);
                  if ( I[0][0] < I[0][1] &&
                       I[1][0] < I[1][1] &&
                       I[2][0] < I[2][1] ) {
                     S[nn].parentID = S[n].id;
                     computeJointPosition(S[nn], I);
                     S[nn].jointRotation = CG.matrixIdentity();
                     if (S[nn].symmetry)
                        createMirrorJoint(nn);
                     break;
                  }
               }
            }
            nameBipedParts();
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
      if (parent(s1) && parent(s1).symmetry) {
         let n = findBlobIndex(parent(s1));
         n += parent(s1).symmetry == 1 ? 1 : -1;
         s2.parentID = S[n].id;
      }
   }

   let setDepthToMaxOfWidthAndHeight = s => {
      let M = s.M;
      let x = CG.norm(M.slice(0, 3));
      let y = CG.norm(M.slice(4, 7));
      let z = CG.norm(M.slice(8,11));
      s.M = CG.matrixMultiply(M, CG.matrixScale(1, 1, Math.max(x,y)/z));
   }

   // RESPOND TO MOUSE/CURSOR EVENTS

   canvas.onPress = (x,y) => {
      if(window.interactMode == 0) return;
      isPressed = true;
      xyTravel = 0;
   }

   canvas.onDrag = (x,y) => {
      if(window.interactMode == 0) return;
      if (mn >= 0) {
         if (isLengthening) {
            let isTranslatingSave = isTranslating;
            let isScalingSave = isScaling;

            isTranslating = false;
            isScaling = true;
            transform(mn, 0, 0, y - yPrev);

            isTranslating = isTranslatingSave;
            isScaling = isScalingSave;
         }
         else
            transform(mn, x - xPrev, y - yPrev, 0);
      }

      xyTravel += Math.abs(x - xPrev) + Math.abs(y - yPrev);
      xPrev = x;
      yPrev = y;
   }
   
   canvas.onRelease = (x,y) => {
      if(window.interactMode == 0) return;
      isPressed = false;
      switch (keyChar) {
      case 'A':
      case 'B':
      case 'X':
      case 'V':
      case 'Z':
         createEnd();                      // ADD A BLOB
         break;

      case 'L':
         isLengthening = false;
         break;

      case 'R':
      case 'S':
      case 'T':
      case 'U':
         isRotating = isScaling = isTranslating = isUniformScaling = false;
         if (mn >= 0 && keyChar == 'T') {
            handleJoint(mn);
            for (let n = 0 ; n < S.length ; n++)
               if (S[n].parentID == S[mn].id)
                  handleJoint(n);
         }
         activeSet(false);
         break;
      }
      keyChar = null;
   }

   canvas.onMove = (x,y) => {
      if(window.interactMode == 0) return;
      if (isCreating)
         createDrag(x, y);
      else if (mn >= 0 && (isRotating || isScaling || isTranslating || isUniformScaling))
         transform(mn, x - xPrev, y - yPrev, 0);
      else if (mn >= 0 && isLengthening) {
         isTranslating = true;
         transform(mn, 0, 0, y - yPrev);
         isTranslating = false;
         isScaling = true;
         transform(mn, 0, 0, y - yPrev);
         isScaling = false;
      }
      else
         findActiveBlob(x, y);

      xPrev = x;
      yPrev = y;
   }
   
   // RESPOND TO THE KEYBOARD

   canvas.onKeyPress = key => {
      if(window.interactMode == 0) return;
      if (key != keyPressed) {
         switch (key) {
         case 16:
            isShift = true;
            return;
         case 17:
            isControl = true;
            return;
         case 189: // '-'
            if (isRubber)
               flash = true;
            return;
         }

         let ch = String.fromCharCode(key);

         if (isControl) {
            switch (ch) {
            case 'Y':
            case 'Z':
               return;
            }
         }

         switch (ch) {
         case 'A':
         case 'B':
         case 'X':
         case 'V':
         case 'Z':
            if (isRubber)
               flash = true;
            break;
         case 'D':
            if (isRubber)
               flash = true;
            break;
         }
      }
      keyPressed = key;
   }

   let ns = () => mn >= 0 ? mn : S.length - 1;

   canvas.onKeyRelease = key => {
      if(window.interactMode == 0) return;

      flash = false;
      keyPressed = -1;

      isRotating = isScaling = isTranslating = isUniformScaling = false;
      let ch = String.fromCharCode(key);
      keyChar = ch;

      // TYPE 0-9 TO SET BLOB COLOR

      if (S.length > 0 && ch >= '0' && ch <= '9') {
         saveForUndo();
         let color = 'color' + (key - 48) + (isLightColor ? 'l' : '');

         // SET COLOR OVER BACKGROUND TO COLOR ALL UNCOLORED BLOBS.

         if (mn < 0) {
            defaultColor = color;
            for (let n = 0 ; n < S.length ; n++)
               if (! S[n].isColored)
                  S[n].color = defaultColor;
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
      switch (key) {
      case 8: // DELETE
         if (isRubber)
            break;
         if (S.length > 0) {
            saveForUndo();
            deleteSelectedBlob();          // DELETE THE SELECTED BLOB
         }
         break;
      case 16:
         isShift = false;
         break;
      case 17:
         isControl = false;
         break;
      case 37: // LEFT ARROW
         if (isSlideshow)
            slideshow.prev();
         else
            rotateyState--;                  // ROTATE LEFT
         return;
      case 38: // UP ARROW
         rotatexState--;                     // ROTATE UP
         return;
      case 39: // RIGHT ARROW
         if (isSlideshow)
            slideshow.next();
         else
            rotateyState++;                  // ROTATE RIGHT
         return;
      case 40: // DOWN ARROW
         rotatexState++;                     // ROTATE DOWN
         return;
      case 187: // EQUALS SIGN
         if (S.length > 0) {
            saveForUndo();
            let sym = S[ns()].symmetry ? 1 : 0;
            for (let i = 0 ; i <= sym ; i++)
               setDepthToMaxOfWidthAndHeight(S[I(ns())+i]);
            activeSet(true);
         }
         return;
      case 189: // '-'
         if (isRubber)
            break;
         if (S.length > 0) {               // MAKE NEGATIVE
            saveForUndo();
            let sym = S[ns()].symmetry ? 1 : 0;
            for (let i = 0 ; i <= sym ; i++)
               S[I(ns())+i].sign = -S[I(ns())+i].sign;
            activeSet(true);
         }
         break;
      case 190: // '.'
         if (S.length > 0) {               // TOGGLE IS BLOBBY
            saveForUndo();
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
         if (S.length > 0) {
            isTranslating = true;
            transform(ns(), 0,0,-.05);     // AWAY
            isTranslating = false;
         }
         break;
      case 220: // '\'
         saveForUndo();
         isRubber = false;
         isWiggling = false;
         isWalking = false;
         noiseState = 0;
         rotatexState = 0;
         rotateyState = 0;
         S = [];                           // NEW: DELETE ALL BLOBS
         mn = -1;
         activeSet(true);
         break;
      case 221: // ']'
         saveForUndo();
         if (S.length > 0) {
            isTranslating = true;
            transform(ns(), 0,0,.05);      // FORWARD
            isTranslating = false;
         }
         break;
      }

      if (isControl) {
         switch (ch) {
         case 'Y':
            redo();
            break;
         case 'Z':
            undo();
            break;
         }
         return;
      }

      if (isShift) {
         switch (ch) {
         case 'Q':
            console.log(JSON.stringify(saveFunction()));
            break;
         case 'R':
            isRoom = ! isRoom;
            break;
         case 'S':
            isShakyCam = ! isShakyCam;
            break;
         case 'T':
            isTextureSrc = ! isTextureSrc;
            break;
         case 'V':
            isRotatedView = ! isRotatedView;
            break;
         case 'X':
            isExperiment = true;
            break;
         case 'Z':
            slideshow.setVisible(isSlideshow = ! isSlideshow);
            break;
         }
         return;
      }

      switch (ch) {
      case 'A':
      case 'B':
      case 'X':
      case 'V':
      case 'Z':
         if (isRubber)
            break;

         saveForUndo();
         if (! isCreating) {
            createBegin(xPrev, yPrev);
            if (ch == 'X') S[mn].type = implicitSurface.CYLINDERX;
            if (ch == 'V') S[mn].type = implicitSurface.CYLINDERY;
            if (ch == 'Z') S[mn].type = implicitSurface.CYLINDERZ;
            if (ch == 'B') S[mn].type = implicitSurface.CUBE;
            isCreating = true;
         }
         break;

      case 'C':
         if (mn >= 0 && S[mn] && S[mn].M) {
            saveForUndo();
            S[mn].M[12] = 0;                    // CENTER BLOB AT CURSOR
            computeQuadric(S[mn]);
         }
         else                                   // BUT IF OVER BACKGROUND
            isCentering = ! isCentering;        // TOGGLE CENTERING MODE
         break;
      case 'D':
         if (isRubber)
            break;
         saveForUndo();
         deleteSelectedBlob();
         break;
      case 'E':
         if (S.length > 0) {                    // BLUR EDGES
            saveForUndo();
            S[ns()].rounded = ! S[ns()].rounded;
            activeSet(true);
         }
         break;
      case 'F':
         noiseState = noiseState == 4 ? 0 : 4;
         break;
      case 'G':
         isWalking = ! isWalking;
         break;
      case 'H':
         isFaceted = ! isFaceted;
         break;
      case 'I':
         helpWindow.style.zIndex = 1 - helpWindow.style.zIndex;
         break;
      case 'J':
         isShowingJoints = ! isShowingJoints;
         break;
      case 'K':
         isShowingBounds = ! isShowingBounds;
         break;
      case 'L':
         isLengthening = true;
         break;
      case 'M':
         if (S.length > 0) {                   // CHANGE MIRROR SYMMETRY
            saveForUndo();
            let n1 = ns(),
                s1 = S[n1];
            switch (s1.symmetry) {
            case 0:                            // CREATE MIRROR SYMMETRY
               let d = s1.M[12] < 0 ? 1 : 0;
               s1.symmetry = 2 - d;
               let s2 = {
                  M: s1.M.slice(),
                  color: s1.color,
                  id: CG.uniqueID(),
                  isBlobby: s1.isBlobby,
                  isColored: s1.isColored,
                  rounded: s1.rounded,
                  sign: s1.sign,
                  symmetry: 1 + d,
                  type: s1.type,
               };
               s2.M[12] = -s1.M[12];
               computeQuadric(s2);
               insertBlob(n1 + d, s2);
               if (s1.jointPosition)
                  createMirrorJoint(n1 + 1 - d);
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
      case 'N':
         noiseState = noiseState == 1 ? 0 : 1;
         break;
      case 'O':
         if (isShift)
            projectManager.clearAll();        // CLEAR ALL PROJECT DATA
         else
            projectManager.clearNames();      // CLEAR PROJECT NAMES
         activeSet(true);
         break;
      case 'P':
         projectManager.choice(loadFunction); // USER CHOOSES PROJECT
         break;
      case 'Q':
         noiseState = noiseState == 2 ? 0 : 2;
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
      case 'U':
         saveForUndo();
         isUniformScaling = true;
         break;
      case 'T':
      case 'W':
         isWiggling = ! isWiggling;
         break;
      case 'Y':
         noiseState = noiseState == 3 ? 0 : 3;
         break;
      }
   }
}

export let textures = [];
export let isTexture = file => textures[file] && ! textures[file + '_error'];
