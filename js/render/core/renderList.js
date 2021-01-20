"use strict";

import { CG, Matrix } from "./CG.js";
import { ImprovedNoise } from "../math/improvedNoise.js";

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
      cl.isToon = this.isToon;
      cl.isMirror = this.isMirror;
      cl.isParticles = this.isParticles;

      for (let i = 0; i < this.matrix.length; i += 1) {
        cl.matrix[i] = this.matrix[i];
      }

      // TODO copy texture

      return cl;
    };

    this.init = () => {
      this.shape = null;
      this.matrix = CG.matrixIdentity();
      this.mx = this.my = this.mz = 0;
      this.rx = this.ry = this.rz = 0;
      this.sx = this.sy = this.sz = 1;
      this.rgb = [0, 0, 0];
      this.opac = 1;
      this.textureInfo = new TextureInfo();
      this.fxMode = 0;
      this.vertexMode = 0;
      this.isToon = false;
      this.isMirror = false;
      this.isParticles = false;
    };
    this.init();
  };

  // this.setWorld = (_w) => (w = _w);
  // this.world = () => {
  //   return w;
  // };

  this.beginFrame = () => ((n = 0), (this.num = 0));
  this.add = (shape) => {
    if (items[n]) items[n].init();
    else items[n] = new Item();
    items[n].shape = shape;
    items[n].matrix = m.value().slice();
    // items[n].matrix = [
    //   1,0,0,0,
    //   0,1,0,0,
    //   0,0,1,0,
    //   0,0,0,1,
    // ];
    this.num++;
    return items[n++];
  };
  this.endFrame = (i) => {
    let item = items[i];
    let mat = item.matrix;
    mat = CG.matrixMultiply(mat, CG.matrixTranslate(item.mx, item.my, item.mz));
    mat = CG.matrixMultiply(mat, CG.matrixRotateX(item.rx));
    mat = CG.matrixMultiply(mat, CG.matrixRotateY(item.ry));
    mat = CG.matrixMultiply(mat, CG.matrixRotateZ(item.rz));
    mat = CG.matrixMultiply(mat, CG.matrixScale(item.sx, item.sy, item.sz));

    return [
      this,
      item.shape,
      mat,
      item.rgb,
      item.opac,
      item.textureInfo,
      item.fxMode,
      item.vertexMode,
      item.toon,
      item.mirror,
      item.particles,
    ];
    //  console.log("there are " + n + " items in the scene");
  };
  this.endFrameWithRange = (drawFunction, i, j) => {
    for (; i < j; i += 1) {
      let item = items[i];
      let mat = item.matrix;
      mat = CG.matrixMultiply(
        mat,
        CG.matrixTranslate(item.mx, item.my, item.mz)
      );
      mat = CG.matrixMultiply(mat, CG.matrixRotateX(item.rx));
      mat = CG.matrixMultiply(mat, CG.matrixRotateY(item.ry));
      mat = CG.matrixMultiply(mat, CG.matrixRotateZ(item.rz));
      mat = CG.matrixMultiply(mat, CG.matrixScale(item.sx, item.sy, item.sz));

      drawFunction(
        item.shape,
        mat,
        item.rgb,
        item.opac,
        item.textureInfo,
        item.fxMode
      );
    }
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

  let items = [],
    n = 0,
    improvedNoise = new ImprovedNoise();
};

RenderList.prototype.mMesh = function (V) {
  return this.add(V);
};
RenderList.prototype.mCube = function () {
  return this.add(CG.cube);
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
  return this.add(CG.sphere);
};
RenderList.prototype.mCylinder = function () {
  return this.add(CG.cylinder);
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

export let renderList = new RenderList();

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
