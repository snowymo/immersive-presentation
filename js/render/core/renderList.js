"use strict";

import { CG, Matrix } from "./CG.js";
import { ImprovedNoise } from "../math/improvedNoise.js";
import { buttonState, controllerMatrix, leftHandState, rightHandState, ids } from "../core/renderListScene.js";
import { pHitTest, pHitTestNew } from "../../util/hitTest.js";

export let m = new Matrix();

class TextureInfo {
  constructor() {
    this.textures = [];
    this.image = null;
    this.scale = 1;
    this.isValid = false;
  }
}

let RenderList = function () {
  let Item = function () {
    this.move = (x, y, z) => {
      this.mx = x;
      this.my = y;
      this.mz = z;
      return this;
    };
    this.turnX = (a) => {
      this.rx = a;
      return this;
    };
    this.turnY = (a) => {
      this.ry = a;
      return this;
    };
    this.turnZ = (a) => {
      this.rz = a;
      return this;
    };
    this.size = (x, y, z) => {
      this.sx = Array.isArray(x) ? x[0] : x;
      this.sy = Array.isArray(x) ? x[1] : y === undefined ? x : y;
      this.sz = Array.isArray(x) ? x[2] : z === undefined ? x : z;
      return this;
    };
    this.sizeWithComponents = (x, y, z) => {
      this.sx = x;
      this.sy = y;
      this.sz = z;
      return this;
    };
    this.sizeWithVector = (v) => {
      this.sx = v[0];
      this.sy = v[1];
      this.sz = v[2];
      return this;
    };
    this.color = (r, g, b) => {
      this.rgb[0] = Array.isArray(r) ? r[0] : r;
      this.rgb[1] = Array.isArray(r) ? r[1] : g;
      this.rgb[2] = Array.isArray(r) ? r[2] : b;
      return this;
    };
    this.colorWithComponents = (r, g, b) => {
      this.rgb[0] = r;
      this.rgb[1] = g;
      this.rgb[2] = b;
      return this;
    };
    this.colorWithVector = (v) => {
      this.rgb[0] = v[0];
      this.rgb[1] = v[1];
      this.rgb[2] = v[2];
      return this;
    };
    this.opacity = (opac) => {
      this.opac = opac;
      // console.log("opac set to: " + this.opac);
      return this;
    };
    this.fx = (type) => {
      this.fxMode = type;
      return this;
    };
    this.vtxMode = (mode) => {
      this.vertexMode = mode;
      return this;
    };
    this.isToon = (toon) => {
      this.toon = toon;
      return this;
    };
    this.isMirror = (mirror) => {
      this.mirror = mirror;
      return this;
    };
    this.isParticles = (particles) => {
      this.particles = particles;
      return this;
    };

    this.textureView = (img, sc = 1) => {
      this.textureInfo.image = img;
      this.textureInfo.scale = sc;
      this.textureInfo.isValid = true;
      return this;
    };
    this.textureAtlas = (txtr) => {
      this.textureInfo.textures.push(txtr);
      return this;
    };

    this.hitEvent = (f, isShared) => {
      this.hit = f;
      this.shared = isShared;
      return this;
    }

    this.group = (n) => {
      if (groups[n] === undefined) {
        groups[n] = [this];
        this.groupInd = 0;
      }
      else if (!groups[n].includes(this)) {
        groups[n].push(this);
        this.groupInd = groups[n].length - 1;
      }
      this.groupId = n;
      return this;
    }

    this.setBaseTexture = (url) => {
      this.texture = url;
    }

    this.clone = () => {
      const cl = this.add(this.shape);
      cl.colorWithVector(this.rgb);
      cl.sizeWithComponents(this.sx, this.sy, this.sz);
      cl.turnX(this.rx);
      cl.turnY(this.ry);
      cl.turnZ(this.rz);
      cl.move(this.mx, this.my, this.mz);
      cl.opac = this.opac;
      cl.textureInfo = this.textureInfo;
      cl.fxMode = this.fxMode;
      cl.vertexMode = this.vertexMode;
      cl.toon = this.toon;
      cl.mirror = this.mirror;
      cl.particles = this.particles;

      for (let i = 0; i < this.matrix.length; i += 1) {
        cl.matrix[i] = this.matrix[i];
      }

      // TODO copy texture

      return cl;
    };

    this.init = () => {
      this.shape = null;
      this.list  = null;
      this.type = 0; // default shape, 1 == list
      this.matrix = CG.matrixIdentity();
      this.auxMatrix = CG.matrixIdentity();
      this.mx = this.my = this.mz = 0;
      this.rx = this.ry = this.rz = 0;
      this.sx = this.sy = this.sz = 1;
      this.rgb = [0, 0, 0];
      this.opac = 1;
      this.textureInfo = new TextureInfo();
      this.texture = null;
      this.fxMode = 0;
      this.vertexMode = 0;
      this.toon = false;
      this.mirror = false;
      this.particles = false;
      this.mesh = null;
    };
    this.init();
  };

  // this.setWorld = (_w) => (w = _w);
  // this.world = () => {
  //   return w;
  // };

  this.beginFrame = () => ((n = 0), (this.num = 0));
  this.beginBuild = () => ((n = 0), (this.num = 0));
  this.endBuild = () => {
    /* do something */
    for (let i=0; i<ids.length; i++) {
      let id = ids[i].id;
      let avt = window.avatars[id];
      if (avt.leftController.buttons === null) continue;
      let bst = {left: [], right: []};
      
      //prevButtons do not seem to update correctly
      /*
      let stL = "released";
      const bL = avt.leftController.buttons;
      const bLPrev = avt.leftController.prevButtons;
      for (let i = 0; i < 7; i++) {
        if (bL[i].pressed && !bLPrev[i].pressed) stL = "pressed";
        else
          if (bL[i].pressed && bLPrev[i].pressed) stL = "dragged";
          else
            if (!bL[i].pressed) stL = "released";
        bst["left"][i] = bL[i].pressed;
      }
      let stR = "released";
      const bR = avt.rightController.buttons;
      const bRPrev = avt.rightController.prevButtons;
      for (let i = 0; i < 7; i++) {
        if (bR[i].pressed && !bRPrev[i].pressed) stR = "pressed";
        else
          if (bR[i].pressed && bRPrev[i].pressed) stR = "dragged";
          else
            if (!bR[i].pressed) stR = "released";
        bst["right"][i] = bR[i].pressed;
      }
      */
      let stL = ids[i].lState;
      const bL = avt.leftController.buttons;
      for (let i = 0; i < 7; i++) {
        bst["left"][i] = bL[i].pressed;
      }
      let stR = ids[i].rState;
      const bR = avt.rightController.buttons;
      for (let i = 0; i < 7; i++) {
        bst["right"][i] = bR[i].pressed;
      }

      let hmR = pHitTestNew(0, id);
      let evR = {handedness: "right",
                state: stR,
                buttonState: bst.right,
                hitItem: hmR};
      let hmL = pHitTestNew(1, id);
      let evL = {handedness: "left",
                state: stL,
                buttonState: bst.left,
                hitItem: hmL};
      if (hmR && hmR.hit !== undefined) {
        hmR.hit(evR);
        if (hmR.shared && hmR.groupId !== undefined) {
          evR.indirect = true;
          for (let i=0; i<groups[hmR.groupId].length; i++) {
            if (i === hmR.groupInd) continue;
            let obj = groups[hmR.groupId][i];
            evR.hitItem = obj;
            obj.hit(evR);
          }
        }
      }
      if (hmL && hmL.hit !== undefined) {
        hmL.hit(evL);
        if (hmL.shared && hmL.groupId !== undefined) {
          evL.indirect = true;
          for (let i=0; i<groups[hmL.groupId].length; i++) {
            if (i === hmL.groupInd) continue;
            let obj = groups[hmL.groupId][i];
            evL.hitItem = obj;
            obj.hit(evL);
          }
        }
      }
    }
    let hmR = pHitTest(0);
    let evR = {handedness: "right",
              state: rightHandState,
              buttonState: buttonState.right,
              hitItem: hmR};
    let hmL = pHitTest(1);
    let evL = {handedness: "left",
              state: leftHandState,
              buttonState: buttonState.left,
              hitItem: hmL};
    if (hmR && hmR.hit !== undefined) {
      hmR.hit(evR);
      if (hmR.shared && hmR.groupId !== undefined) {
        evR.indirect = true;
        for (let i=0; i<groups[hmR.groupId].length; i++) {
          if (i === hmR.groupInd) continue;
          let obj = groups[hmR.groupId][i];
          evR.hitItem = obj;
          obj.hit(evR);
        }
      }
    }
    if (hmL && hmL.hit !== undefined) {
      hmL.hit(evL);
      if (hmL.shared && hmL.groupId !== undefined) {
        evL.indirect = true;
        for (let i=0; i<groups[hmL.groupId].length; i++) {
          if (i === hmL.groupInd) continue;
          let obj = groups[hmL.groupId][i];
          evL.hitItem = obj;
          obj.hit(evL);
        }
      }
    }
  };
  this.add = (shape, name) => {
    if (items[n]) items[n].init();
    else items[n] = new Item();
    items[n].shape = shape;
    items[n].matrix = m.value().slice();
    if (name) items[n].mesh = name;
    this.num++;
    return items[n++];
  };
  this.addMesh = (mesh) => {
    if (items[n]) items[n].init();
    else items[n] = new Item();
    items[n].matrix = m.value().slice();
    items[n].auxMatrix = CG.matrixIdentity();
    items[n].type = 0;
    items[n].mesh = mesh;
    return items[n++];
  };
  this.addList = (list) => {
    if (items[n]) items[n].init();
    else items[n] = new Item();
    items[n].list = list;
    items[n].matrix = m.value().slice();
    items[n].auxMatrix = CG.matrixIdentity();
    items[n].type = 1;
    return items[n++];
  };

  const buf0 = [];
  for (let val = 0; val < 16; val += 1) {
    buf0.push(0);
  }

  const buf1 = [];
  for (let val = 0; val < 16; val += 1) {
    buf1.push(0);
  }

  this.endFrame = (i) => {
    let item = items[i];
    let mat = item.matrix;
    CG.matrixMultiplyWithBuffer(
      buf0,
      mat,
      CG.matrixTranslateComponentsWithBuffer(
        CG.translationBuffer,
        item.mx,
        item.my,
        item.mz
      )
    );
    CG.matrixMultiplyWithBuffer(
      buf1,
      buf0,
      CG.matrixRotateXWithBuffer(CG.rotateXBuffer, item.rx)
    );
    CG.matrixMultiplyWithBuffer(
      buf0,
      buf1,
      CG.matrixRotateYWithBuffer(CG.rotateYBuffer, item.ry)
    );
    CG.matrixMultiplyWithBuffer(
      buf1,
      buf0,
      CG.matrixRotateZWithBuffer(CG.rotateZBuffer, item.rz)
    );
 
    mat = CG.matrixMultiplyWithBuffer(
      item.auxMatrix,
      buf1,
      CG.matrixScaleNonUniformWithBuffer(
        CG.scaleBuffer,
        item.sx,
        item.sy,
        item.sz
      )
    );
    item.matrix = mat;
    switch (item.type) {
      // render list
      case 1: {
        const list = item.list;
        list.drawWithGlobalMatrix(mat);
        break;
      }
      default: {
        return [
          this,
          item.shape,
          mat,
          item.rgb,
          item.opac,
          item.textureInfo,
          item.texture,
          item.fxMode,
          item.vertexMode,
          item.toon,
          item.mirror,
          item.particles,
        ];
      }
    }
    //  console.log("there are " + n + " items in the scene");
  };

  this.drawWithGlobalMatrix = (globalMat) => {
    for (let i = 0; i < n; i++) {
      let item = items[i];

      const buf0 = [];
      for (let val = 0; val < 16; val += 1) {
        buf0.push(0);
      }

      const buf1 = [];
      for (let val = 0; val < 16; val += 1) {
        buf1.push(0);
      }

      CG.matrixMultiplyWithBuffer(buf1, globalMat, item.matrix);
      CG.matrixMultiplyWithBuffer(
        buf0,
        buf1,
        CG.matrixTranslateComponentsWithBuffer(
          CG.translationBuffer,
          item.mx,
          item.my,
          item.mz
        )
      );
      CG.matrixMultiplyWithBuffer(
        buf1,
        buf0,
        CG.matrixRotateXWithBuffer(CG.rotateXBuffer, item.rx)
      );
      CG.matrixMultiplyWithBuffer(
        buf0,
        buf1,
        CG.matrixRotateYWithBuffer(CG.rotateYBuffer, item.ry)
      );
      CG.matrixMultiplyWithBuffer(
        buf1,
        buf0,
        CG.matrixRotateZWithBuffer(CG.rotateZBuffer, item.rz)
      );
      let mat = CG.matrixMultiplyWithBuffer(
        item.auxMatrix,
        buf1,
        CG.matrixScaleNonUniformWithBuffer(
          CG.scaleBuffer,
          item.sx,
          item.sy,
          item.sz
        )
      );
      items[i].matrix = mat;
      switch (item.type) {
        // render list
        case 1: {
          const list = item.list;
          list.drawWithGlobalMatrix(mat);
          break;
        }
        default: {
          return [
            this,
            item.shape,
            mat,
            item.rgb,
            item.opac,
            item.textureInfo,
            item.texture,
            item.fxMode,
            item.vertexMode,
            item.toon,
            item.mirror,
            item.particles,
          ];
        }
      }
    }
    //      console.log("there are " + n + " items in the scene");
  };

  this.setTextureCatalogue = (textureCatalogue) => {
    this.textureCatalogue = textureCatalogue;
  };

  this.initBuffer = (gl) => {
    this.buffer = gl.createBuffer();
  };
  this.initVAO = (gl) => {
    this.vao = gl.createVertexArray();
  };

  this.prev_shape = null;
  this.program = null;
  this.num = 0;

  this.getItems = () => {
    return items;
  }

  let items = [],
    n = 0,
    improvedNoise = new ImprovedNoise();
  let groups = [];
};

RenderList.prototype.mMesh = function (V) {
  return this.add(V);
};
RenderList.prototype.mCube = function () {
  return this.add(CG.cube, "cube");
};
RenderList.prototype.mPoly4 = function (V) {
  return this.add(CG.createPoly4Vertices(V));
};
RenderList.prototype.mPolyhedron = function (V) {
  return this.add(CG.createPoly4Vertices(V));
};
RenderList.prototype.mQuad = function () {
  return this.add(CG.quad);
};
RenderList.prototype.mSquare = function () {
  return this.add(CG.quad);
};
RenderList.prototype.mSphere = function () {
  return this.add(CG.sphere, "sphere");
};
RenderList.prototype.mCylinder = function () {
  return this.add(CG.cylinder, "cylinder");
};
RenderList.prototype.mRoundedCylinder = function () {
  return this.add(CG.roundedCylinder);
};
RenderList.prototype.mTorus = function () {
  return this.add(CG.torus);
};
RenderList.prototype.mDisk = function () {
  return this.add(CG.disk);
};
RenderList.prototype.mCone = function () {
  return this.add(CG.cone);
};
RenderList.prototype.mTube = function () {
  return this.add(CG.tube);
};
RenderList.prototype.mTube3 = function () {
  return this.add(CG.tube3);
};
RenderList.prototype.mGluedCylinder = function () {
  return this.add(CG.gluedCylinder);
};
RenderList.prototype.mFoo = function () {
  return this.add(CG.foo);
};

export let renderList = new RenderList();
let activeList = renderList;

export function mList(list) {
  activeList.addList(list);
};

export function mBeginBuild() {
  activeList = new RenderList();
}
export function mEndBuild() {
  const out  = activeList;
  activeList = renderList;
  return out;
}


// TO DO:

/*
let mBegin           = ()  => ...
let mEnd             = ()  => ...

// USAGE:

   // EXAMPLE OF CONSTRUCTING OBJECT:

   mFoo = mBegin();
      m.identity();
      m.rotateX(Math.PI/4);
      mCube().size(.5).color(1,0,0);
      mCube().move(0,0,.6).size(.1).color(0,0,1);
   mEnd();

   // TO RENDER OBJECT:

   mFoo();
*/

/*

   // Implementation:

   mBegin = () => {
      renderList.object = new Function('renderList.add(this.__buffer__)');
      renderList.buffer = [];
      return renderList.object;
   }

   mEnd = () => renderList.mObject.__buffer__ = renderList.buffer;

*/
