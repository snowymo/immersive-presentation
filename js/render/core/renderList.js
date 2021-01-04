"use strict";

import CG from './CG.js';

class TextureInfo {
   constructor() {
      this.textures = [];
      this.image   = null;
      this.scale   = 1;
      this.isValid = false;
   }
}

let RenderList = function() {
   let Item = function() {
      this.move = (x,y,z) => {
         this.mx = Array.isArray(x) ? x[0] : x;
         this.my = Array.isArray(x) ? x[1] : y;
         this.mz = Array.isArray(x) ? x[2] : z;
         return this;
      };
      this.turnX = a => { this.rx = a; return this; }
      this.turnY = a => { this.ry = a; return this; }
      this.turnZ = a => { this.rz = a; return this; }
      this.size = (x,y,z) => {
         this.sx = Array.isArray(x) ? x[0] : x;
         this.sy = Array.isArray(x) ? x[1] : y === undefined ? x : y;
         this.sz = Array.isArray(x) ? x[2] : z === undefined ? x : z;
         return this;
      };
      this.sizeWithComponents = (x,y,z) => {
         this.sx = x;
         this.sy = y;
         this.sz = z;
         return this;
      };
      this.sizeWithVector = v => {
         this.sx = v[0];
         this.sy = v[1];
         this.sz = v[2];
         return this;
      };
      this.color = (r,g,b) => {
         this.rgb[0] = Array.isArray(r) ? r[0] : r;
         this.rgb[1] = Array.isArray(r) ? r[1] : g;
         this.rgb[2] = Array.isArray(r) ? r[2] : b;
         return this;
      };
      this.colorWithComponents = (r,g,b) => {
         this.rgb[0] = r;
         this.rgb[1] = g;
         this.rgb[2] = b;
         return this;
      };
      this.colorWithVector = v => {
         this.rgb[0] = v[0];
         this.rgb[1] = v[1];
         this.rgb[2] = v[2];
         return this;
      };
      this.opacity = opac => { this.opac = opac; return this; };
      this.fx = type => { this.fxMode = type; return this; };
      this.vtxMode = mode => { this.vertexMode = mode; return this; }

      this.textureView = (img, sc = 1) => {
         this.textureInfo.image = img;
         this.textureInfo.scale = sc;
         this.textureInfo.isValid = true;
         return this;
      }
      this.textureAtlas = (txtr)=> {
         this.textureInfo.textures.push(txtr);
         return this;
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

         for (let i = 0; i < this.matrix.length; i += 1) {
            cl.matrix[i] = this.matrix[i];
         }

         // TODO copy texture

         return cl;
      }


      this.init = () => {
         this.shape = null;
         this.matrix = CG.matrixIdentity();
         this.mx = this.my = this.mz = 0;
         this.rx = this.ry = this.rz = 0;
         this.sx = this.sy = this.sz = 1;
         this.rgb = [0,0,0];
         this.opac = 1;
         this.textureInfo = new TextureInfo();
         this.fxMode = 0;
         this.vertexMode = 0;
         this.buffer = gl.createBuffer();
         this.prev_shape = null;
      }
      this.init();
   }

   this.setWorld = _w => w = _w;
   this.world = () => { return w; };
   this.beginFrame = () => n = 0;
   this.add = shape => {
      if (items[n])
         items[n].init();
      else
         items[n] = new Item();
      items[n].shape = shape;
      items[n].matrix = w.m.value().slice();
      return items[n++];
   }
   this.endFrame = drawFunction => {
      for (let i = 0 ; i < n ; i++) {
         let item = items[i];
         let mat = item.matrix;
         mat = CG.matrixMultiply(mat, CG.matrixTranslate(item.mx, item.my, item.mz));
         mat = CG.matrixMultiply(mat, CG.matrixRotateX  (item.rx));
         mat = CG.matrixMultiply(mat, CG.matrixRotateY  (item.ry));
         mat = CG.matrixMultiply(mat, CG.matrixRotateZ  (item.rz));
         mat = CG.matrixMultiply(mat, CG.matrixScale    (item.sx, item.sy, item.sz));

         drawFunction(item.shape, mat, item.rgb, item.opac, item.textureInfo, item.fxMode, item.vertexMode);
      }
//      console.log("there are " + n + " items in the scene");
   }
   this.endFrameWithRange = (drawFunction, i, j) => {
      for (; i < j; i += 1) {
         let item = items[i];
         let mat = item.matrix;
         mat = CG.matrixMultiply(mat, CG.matrixTranslate(item.mx, item.my, item.mz));
         mat = CG.matrixMultiply(mat, CG.matrixRotateX  (item.rx));
         mat = CG.matrixMultiply(mat, CG.matrixRotateY  (item.ry));
         mat = CG.matrixMultiply(mat, CG.matrixRotateZ  (item.rz));
         mat = CG.matrixMultiply(mat, CG.matrixScale    (item.sx, item.sy, item.sz));

         drawFunction(item.shape, mat, item.rgb, item.opac, item.textureInfo, item.fxMode);
      }
   }

   this.setTextureCatalogue = textureCatalogue => {
      this.textureCatalogue = textureCatalogue;
   }
   
   let w = null, n = 0, items = [];
}

export let renderList = new RenderList();

export let mCube            = () => renderList.add(CG.cube);
export let mPoly4           = V  => renderList.add(CG.createPoly4Vertices(V));
export let mPolyhedron      = V  => renderList.add(CG.createPoly4Vertices(V));
export let mQuad            = () => renderList.add(CG.quad);
export let mSquare          = () => renderList.add(CG.quad);
export let mSphere          = () => renderList.add(CG.sphere);
export let mCylinder        = () => renderList.add(CG.cylinder);
export let mRoundedCylinder = () => renderList.add(CG.roundedCylinder);
export let mTorus           = () => renderList.add(CG.torus);
export let mDisk            = () => renderList.add(CG.disk);
export let mCone            = () => renderList.add(CG.cone);
export let mTube            = () => renderList.add(CG.tube);
export let mTube3           = () => renderList.add(CG.tube3);
export let mGluedCylinder   = () => renderList.add(CG.gluedCylinder);

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
