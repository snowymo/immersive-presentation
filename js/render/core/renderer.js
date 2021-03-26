// Copyright 2018 The Immersive Web Community Group
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { CAP, MAT_STATE, RENDER_ORDER, stateToBlendFunc } from "./material.js";
import { Node } from "./node.js";
import { Program } from "./program.js";
import { DataTexture, VideoTexture } from "./texture.js";
import { mat4, vec3 } from "../math/gl-matrix.js";
import { CG, VERTEX_SIZE } from "./CG.js";
import { m, renderList } from "./renderList.js";
import { renderListScene } from "./renderListScene.js";
// import * as Image from "../../util/image.js";
// import * as Tex from "../../util/webgl_texture_util.js";
// import { loadImage } from "../../immersive-pre.js"

export const ATTRIB = {
  POSITION: 1,
  NORMAL: 2,
  TANGENT: 3,
  TEXCOORD_0: 4,
  TEXCOORD_1: 5,
  COLOR_0: 6,
};

export const ATTRIB_MASK = {
  POSITION: 0x0001,
  NORMAL: 0x0002,
  TANGENT: 0x0004,
  TEXCOORD_0: 0x0008,
  TEXCOORD_1: 0x0010,
  COLOR_0: 0x0020,
};

const GL = WebGLRenderingContext; // For enums

const DEF_LIGHT_DIR1 = new Float32Array([-0.1,-1., 1]);
const DEF_LIGHT_DIR2 = new Float32Array([ 0,-2.5, 0]);
const DEF_LIGHT_COLOR = new Float32Array([10.0, 10.0, 10.0]);

const PRECISION_REGEX = new RegExp("precision (lowp|mediump|highp) float;");

const VERTEX_SHADER_SINGLE_ENTRY = `
uniform mat4 PROJECTION_MATRIX, VIEW_MATRIX, MODEL_MATRIX;

void main() {
  gl_Position = vertex_main(PROJECTION_MATRIX, VIEW_MATRIX, MODEL_MATRIX);
}
`;

const VERTEX_SHADER_MULTI_ENTRY = `
#ERROR Multiview rendering is not implemented
void main() {
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_ENTRY = `
void main() {
  gl_FragColor = fragment_main();
}
`;

const RenderList_VERTEX_SOURCE = `#version 300 es
precision highp float;

// input vertex
in  vec3 aPos;
in  vec3 aNor;
in  vec3 aTan;
in  vec2 aUV;
in  vec4 aUVOff;
in  vec3 aRGB;

// interpolated vertex
out vec3 vP;
out vec3 vPos;
out vec3 vNor;
out vec3 vTan;
out vec3 vBin;
out vec2 vUV;
out vec3 vRGB;

// interpolated cursor
out vec3 vCursor;

out vec2 vXY;

// matrices
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

uniform float uTime;     // time in seconds
uniform float uToon;     // control toon shading

void main(void) {
    vec4 pos = uProj * uView * uModel * vec4(aPos, 1.);
    vXY = pos.xy / pos.z;
    vP = pos.xyz;
    vPos = aPos;
    vRGB = aRGB;
    mat4 invModel = inverse(uModel);
    vNor = (vec4(aNor, 0.) * invModel).xyz;
    vTan = (vec4(aTan, 0.) * invModel).xyz;
    vBin = cross(vNor, vTan);

    // image_uv + mesh_uv * (image_dimensions / atlas_dimensions)

    // formula for atlas
    //vUV = (aUVOff.xy + (aUV.xy * aUVOff.zw)) * vec2(1.,-1.) + vec2(0.,1.);
    vUV = (aUV) * vec2(1.,-1.) + vec2(0.,1.);
    
    gl_Position = pos + uToon * vec4(normalize(vNor).xy, 0.,0.);
}
`;

const RenderList_FRAG_SOURCE = `#version 300 es // NEWER VERSION OF GLSL
precision highp float; // HIGH PRECISION FLOATS

uniform vec4 uColor;
uniform vec3 uCursor; // CURSOR: xy=pos, z=mouse up/down
uniform float uTime; // TIME, IN SECONDS

in vec2 vXY; // POSITION ON IMAGE
in vec3 vP;
in vec3 vPos; // POSITION
in vec3 vNor; // NORMAL
in vec3 vTan; // TANGENT
in vec3 vBin; // BINORMAL
in vec2 vUV ; // U,V
in vec3 vRGB; // R,G,B


#define LDIR_MAX_COUNT (1)

vec3 Ldir[LDIR_MAX_COUNT];
vec3 Lrgb[LDIR_MAX_COUNT];

uniform int uBumpIndex;
uniform float uBumpScale;
uniform float uParticles;
uniform float uToon;

uniform int uTexIndex;
uniform float uTexScale;
uniform float uBrightness;

uniform int uFxMode;
uniform vec3 uWindowDir;

// base
uniform sampler2D uTex0;
// bump
uniform sampler2D uTex1;
// anything else ...
uniform sampler2D uTex2;
uniform sampler2D uTex3;
uniform sampler2D uTex4;
uniform sampler2D uTex5;
uniform sampler2D uTex6;
uniform sampler2D uTex7;

out vec4 fragColor; // RESULT WILL GO HERE

vec3 bumpTexture(vec3 normal, vec4 bump) {
  return normalize((.5 - bump.x) * normalize(vTan) + (.5 - bump.y) * normalize(vBin) + (.5 - bump.z) * normal);
}

vec3 phong(vec3 Ldir, vec3 Lrgb, vec3 normal, vec3 diffuse, vec3 specular, float p) {
  vec3 color = vec3(0., 0., 0.);
  float d = dot(Ldir, normal);
  if (d > 0.)
    color += diffuse * d * Lrgb;

  vec3 R = 2. * normal * dot(Ldir, normal) - Ldir;
  float s = dot(R, normal);
  if (s > 0.)
    color += specular * pow(s, p) * Lrgb;
  return color;
}

vec3 phongPlaster(vec3 Ldir, vec3 Lrgb, vec3 normal, vec3 diffuse, vec3 specular, float p) {
  vec3 color = vec3(0., 0., 0.);
  float d = dot(Ldir, normal);
  if (d > 0.)
    color += diffuse * d * uColor.rgb + .01 * diffuse * d * Lrgb;

  vec3 R = 2. * normal * dot(Ldir, normal) - Ldir;
  float s = dot(R, normal);
  if (s > 0.)
    color += specular * pow(s, p) * uColor.rgb + .01 * specular * pow(s, p) * Lrgb;
  return color;
}

vec3 phongRub(vec3 Ldir, vec3 Lrgb, vec3 normal, vec3 diffuse, vec3 specular, float p) {
  vec3 color = vec3(0., 0., 0.);
  float d = dot(Ldir, normal);
  if (d > 0.)
    color += diffuse * d * Lrgb;

  vec3 R = 2. * normal * dot(Ldir, normal) - Ldir;
  float s = dot(R, normal);
  if (s > 0.95)
    color += .2 * specular;
  return color;
}

void main() {
  vec4 texture0 = texture(uTex0, vUV * uTexScale);
  vec4 texture1 = texture(uTex1, vUV * uTexScale);
  vec4 texture2 = texture(uTex2, vUV * uTexScale);
  vec3 ambient = .1 * uColor.rgb;
  vec3 diffuse = .5 * uColor.rgb;
  vec3 specular = vec3(.4, .4, .4);
  float p = 30.;
  float pMet = 40.;

  Ldir[0] = -1. * normalize(uWindowDir);
//  Ldir[1] = normalize(vec3(-1., -.5, -2.));
//  Ldir[2] = normalize(vec3(-1., 0, 0.5));
  Lrgb[0] = vec3(0.85, .75, .7);
//  Lrgb[1] = vec3(.8, .75, .7);
//  Lrgb[2] = vec3(.1, .15, .2);

  vec3 normal = normalize(vNor);
  vec3 color = ambient;

  float alpha = uColor.a;
/*
  {
     float u = 2. * vUV.x - 1., v = 2. * vUV.y - 1.;
     float t = max(0., 1. - u*u - v*v);
     alpha *= mix(1., t, uParticles);
  }
*/

  if (uTexIndex < 0) {
    if (uFxMode == 0) {      //default
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phong(Ldir[i], Lrgb[i], normal, diffuse, specular, p);
    } else if (uFxMode == 1) {      // plaster
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phongPlaster(Ldir[i], Lrgb[i], normal, diffuse, specular, 5.);
    } else if (uFxMode == 2) {      // metallic
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phong(Ldir[i], Lrgb[i], normal, vec3(0., 0., 0.), ambient * 150., pMet);
    } else if (uFxMode == 3) {      // glossy rubber
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phongRub(Ldir[i], Lrgb[i], normal, diffuse, specular, p);
    } else if (uFxMode == 4) {      // 2D
        color += uColor.rgb;
    }
    color.rgb *= vRGB;
    fragColor = vec4(sqrt(color.rgb) * (uToon == 0. ? 1. : 0.), alpha) * uBrightness;
  } else {
    normal = (uBumpIndex < 0) ? normal : bumpTexture(normal, texture(uTex1, vUV));

    if (uFxMode == 0) {      //default
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phong(Ldir[i], Lrgb[i], normal, diffuse, specular, p);
    } else if (uFxMode == 1) {      // plaster
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phongPlaster(Ldir[i], Lrgb[i], normal, diffuse, specular, 5.);
    } else if (uFxMode == 2) {      // metallic
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phong(Ldir[i], Lrgb[i], normal, vec3(0., 0., 0.), ambient * 150., pMet);
    } else if (uFxMode == 3) {      // glossy rubber
      for (int i = 0; i < LDIR_MAX_COUNT; i += 1)
        color += phongRub(Ldir[i], Lrgb[i], normal, diffuse, specular, p);
    } else if (uFxMode == 4) {      // 2D
        color += uColor.rgb;
    }

    fragColor = vec4(sqrt(color.rgb) * (uToon == 0. ? 1. : 0.), alpha) * uBrightness;

    fragColor *= texture(uTex0, vUV);
  }
}
`

function isPowerOfTwo(n) {
  return (n & (n - 1)) === 0;
}

// export async function initRenderListGl(gl) {
//   if(!renderList.program) {
//     renderList.program = new Program(gl, RenderList_VERTEX_SOURCE, RenderList_FRAG_SOURCE);
//     gl.enable(gl.DEPTH_TEST);
//     gl.enable(gl.CULL_FACE);
//     gl.enable(gl.BLEND);
//     gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
//     await loadImages(gl);
//   }
// }

// async function loadImages(gl) {

//   let images = null;
//   try {
//     images = await Image.loadImagesAsync([
//       "webxr/assets/textures/brick.png",
//     ]);
//     // stores textures
//     window.textureCatalogue = new Tex.TextureCatalogue(gl);

//     // texture configuration object
//     const textureDesc = Tex.makeTexture2DDescriptor(gl);
//     textureDesc.generateMipmap = true;
//     textureDesc.name = 'tex';

//     textureDesc.paramList.push([gl.TEXTURE_WRAP_S, gl.REPEAT]);
//     textureDesc.paramList.push([gl.TEXTURE_WRAP_T, gl.REPEAT]);
//     textureDesc.paramList.push([gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST]);
//     textureDesc.paramList.push([gl.TEXTURE_MAG_FILTER, gl.LINEAR]);

//     window.textures = Tex.makeIndividualTexture2DsWithImages(
//       window.textureCatalogue,
//       textureDesc,
//       // array 0...length-1 for texture slots to use
//       Array.from({
//         length: images.length
//       }, (_, i) => i),
//       images, [
//       "brick", 
//     ],
//       0
//     );

//     // INSTRUCTIONS
//     //
//     // Just to show that this works, I attach a temporary canvas to the document,
//     // and this canvas has the texture images drawn to it (not WebGL).
//     // zoom out with command - since the images are large
//     //
//     // lookup texture atlas (one-to-many individual images):
//     //
//     // w.textureCatalogue.lookupByName("atlas1");

//     //
//     // it's faster if you know the direct ID
//     // w.textureCatalogue.lookupByID(1)

//     //
//     // lookup image stored in a texture atlas
//     // const texAtlas = ... some atlas
//     // const image = atlas.lookupImageByName('wood');

//     //
//     // direct access by ID is faster
//     //
//     // index of first image in this atlas
//     // const image = texAtlas.lookupImageByID(1)

//   } catch (e) {
//     console.error(e);
//   }

// }

// Creates a WebGL context and initializes it with some common default state.
export function createWebGLContext(glAttribs) {
  glAttribs = glAttribs || { alpha: false };

  let webglCanvas = document.createElement("canvas");
  let contextTypes = glAttribs.webgl2
    ? ["webgl2"]
    : ["webgl", "experimental-webgl"];
  let context = null;

  for (let contextType of contextTypes) {
    context = webglCanvas.getContext(contextType, glAttribs);
    if (context) {
      break;
    }
  }

  if (!context) {
    let webglType = glAttribs.webgl2 ? "WebGL 2" : "WebGL";
    console.error("This browser does not support " + webglType + ".");
    return null;
  }

  return context;
}

export class RenderView {
  constructor(projectionMatrix, viewTransform, viewport = null, eye = "left") {
    this.projectionMatrix = projectionMatrix;
    this.viewport = viewport;
    // If an eye isn't given the left eye is assumed.
    this._eye = eye;
    this._eyeIndex = eye == "left" ? 0 : 1;

    // Compute the view matrix
    if (viewTransform instanceof Float32Array) {
      this._viewMatrix = mat4.clone(viewTransform);
      this.viewTransform = new XRRigidTransform(); // TODO
    } else {
      this.viewTransform = viewTransform;
      this._viewMatrix = viewTransform.inverse.matrix;

      // Alternative view matrix code path
      /*this._viewMatrix = mat4.create();
      let q = viewTransform.orientation;
      let t = viewTransform.position;
      mat4.fromRotationTranslation(
          this._viewMatrix,
          [q.x, q.y, q.z, q.w],
          [t.x, t.y, t.z]
      );
      mat4.invert(this._viewMatrix, this._viewMatrix);*/
    }
  }

  get viewMatrix() {
    return this._viewMatrix;
  }

  get eye() {
    return this._eye;
  }

  set eye(value) {
    this._eye = value;
    this._eyeIndex = value == "left" ? 0 : 1;
  }

  get eyeIndex() {
    return this._eyeIndex;
  }
}

class RenderBuffer {
  constructor(target, usage, buffer, length = 0) {
    this._target = target;
    this._usage = usage;
    this._length = length;
    if (buffer instanceof Promise) {
      this._buffer = null;
      this._promise = buffer.then((buffer) => {
        this._buffer = buffer;
        return this;
      });
    } else {
      this._buffer = buffer;
      this._promise = Promise.resolve(this);
    }
  }

  waitForComplete() {
    return this._promise;
  }
}

class RenderPrimitiveAttribute {
  constructor(primitiveAttribute) {
    this._attrib_index = ATTRIB[primitiveAttribute.name];
    this._componentCount = primitiveAttribute.componentCount;
    this._componentType = primitiveAttribute.componentType;
    this._stride = primitiveAttribute.stride;
    this._byteOffset = primitiveAttribute.byteOffset;
    this._normalized = primitiveAttribute.normalized;
  }
}

class RenderPrimitiveAttributeBuffer {
  constructor(buffer) {
    this._buffer = buffer;
    this._attributes = [];
  }
}

class RenderPrimitive {
  constructor(primitive) {
    this._activeFrameId = 0;
    this._instances = [];
    this._material = null;

    this.setPrimitive(primitive);
  }

  setPrimitive(primitive) {
    this._mode = primitive.mode;
    this._elementCount = primitive.elementCount;
    this._promise = null;
    this._vao = null;
    this._complete = false;
    this._attributeBuffers = [];
    this._attributeMask = 0;

    for (let attribute of primitive.attributes) {
      this._attributeMask |= ATTRIB_MASK[attribute.name];
      let renderAttribute = new RenderPrimitiveAttribute(attribute);
      let foundBuffer = false;
      for (let attributeBuffer of this._attributeBuffers) {
        if (attributeBuffer._buffer == attribute.buffer) {
          attributeBuffer._attributes.push(renderAttribute);
          foundBuffer = true;
          break;
        }
      }
      if (!foundBuffer) {
        let attributeBuffer = new RenderPrimitiveAttributeBuffer(
          attribute.buffer
        );
        attributeBuffer._attributes.push(renderAttribute);
        this._attributeBuffers.push(attributeBuffer);
      }
    }

    this._indexBuffer = null;
    this._indexByteOffset = 0;
    this._indexType = 0;

    if (primitive.indexBuffer) {
      this._indexByteOffset = primitive.indexByteOffset;
      this._indexType = primitive.indexType;
      this._indexBuffer = primitive.indexBuffer;
    }

    if (primitive._min) {
      this._min = vec3.clone(primitive._min);
      this._max = vec3.clone(primitive._max);
    } else {
      this._min = null;
      this._max = null;
    }

    if (this._material != null) {
      this.waitForComplete(); // To flip the _complete flag.
    }
  }

  setRenderMaterial(material) {
    this._material = material;
    this._promise = null;
    this._complete = false;

    if (this._material != null) {
      this.waitForComplete(); // To flip the _complete flag.
    }
  }

  markActive(frameId) {
    if (this._complete && this._activeFrameId != frameId) {
      if (this._material) {
        if (!this._material.markActive(frameId)) {
          return;
        }
      }
      this._activeFrameId = frameId;
    }
  }

  get samplers() {
    return this._material._samplerDictionary;
  }

  get uniforms() {
    return this._material._uniform_dictionary;
  }

  waitForComplete() {
    if (!this._promise) {
      if (!this._material) {
        return Promise.reject("RenderPrimitive does not have a material");
      }

      let completionPromises = [];

      for (let attributeBuffer of this._attributeBuffers) {
        if (!attributeBuffer._buffer._buffer) {
          completionPromises.push(attributeBuffer._buffer._promise);
        }
      }

      if (this._indexBuffer && !this._indexBuffer._buffer) {
        completionPromises.push(this._indexBuffer._promise);
      }

      this._promise = Promise.all(completionPromises).then(() => {
        this._complete = true;
        return this;
      });
    }
    return this._promise;
  }
}

export class RenderTexture {
  constructor(texture) {
    this._texture = texture;
    this._complete = false;
    this._activeFrameId = 0;
    this._activeCallback = null;
  }

  markActive(frameId) {
    if (this._activeCallback && this._activeFrameId != frameId) {
      this._activeFrameId = frameId;
      this._activeCallback(this);
    }
  }
}

const inverseMatrix = mat4.create();

function setCap(gl, glEnum, cap, prevState, state) {
  let change = (state & cap) - (prevState & cap);
  if (!change) {
    return;
  }

  if (change > 0) {
    gl.enable(glEnum);
  } else {
    gl.disable(glEnum);
  }
}

class RenderMaterialSampler {
  constructor(renderer, materialSampler, index) {
    this._renderer = renderer;
    this._uniformName = materialSampler._uniformName;
    this._renderTexture = renderer._getRenderTexture(materialSampler._texture);
    this._index = index;
  }

  set texture(value) {
    this._renderTexture = this._renderer._getRenderTexture(value);
  }
}

class RenderMaterialUniform {
  constructor(materialUniform) {
    this._uniformName = materialUniform._uniformName;
    this._uniform = null;
    this._length = materialUniform._length;
    if (materialUniform._value instanceof Array) {
      this._value = new Float32Array(materialUniform._value);
    } else {
      this._value = new Float32Array([materialUniform._value]);
    }
  }

  set value(value) {
    if (this._value.length == 1) {
      this._value[0] = value;
    } else {
      for (let i = 0; i < this._value.length; ++i) {
        this._value[i] = value[i];
      }
    }
  }
}

class RenderMaterial {
  constructor(renderer, material, program) {
    this._program = program;
    this._state = material.state._state;
    this._activeFrameId = 0;
    this._completeForActiveFrame = false;

    this._samplerDictionary = {};
    this._samplers = [];
    for (let i = 0; i < material._samplers.length; ++i) {
      let renderSampler = new RenderMaterialSampler(
        renderer,
        material._samplers[i],
        i
      );
      this._samplers.push(renderSampler);
      this._samplerDictionary[renderSampler._uniformName] = renderSampler;
    }

    this._uniform_dictionary = {};
    this._uniforms = [];
    for (let uniform of material._uniforms) {
      let renderUniform = new RenderMaterialUniform(uniform);
      this._uniforms.push(renderUniform);
      this._uniform_dictionary[renderUniform._uniformName] = renderUniform;
    }

    this._firstBind = true;

    this._renderOrder = material.renderOrder;
    if (this._renderOrder == RENDER_ORDER.DEFAULT) {
      if (this._state & CAP.BLEND) {
        this._renderOrder = RENDER_ORDER.TRANSPARENT;
      } else {
        this._renderOrder = RENDER_ORDER.OPAQUE;
      }
    }
  }

  bind(gl) {
    // First time we do a binding, cache the uniform locations and remove
    // unused uniforms from the list.
    if (this._firstBind) {
      for (let i = 0; i < this._samplers.length; ) {
        let sampler = this._samplers[i];
        if (!this._program.uniform[sampler._uniformName]) {
          this._samplers.splice(i, 1);
          continue;
        }
        ++i;
      }

      for (let i = 0; i < this._uniforms.length; ) {
        let uniform = this._uniforms[i];
        uniform._uniform = this._program.uniform[uniform._uniformName];
        if (!uniform._uniform) {
          this._uniforms.splice(i, 1);
          continue;
        }
        ++i;
      }
      this._firstBind = false;
    }

    for (let sampler of this._samplers) {
      gl.activeTexture(gl.TEXTURE0 + sampler._index);
      if (sampler._renderTexture && sampler._renderTexture._complete) {
        gl.bindTexture(gl.TEXTURE_2D, sampler._renderTexture._texture);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
    }

    for (let uniform of this._uniforms) {
      switch (uniform._length) {
        case 1:
          gl.uniform1fv(uniform._uniform, uniform._value);
          break;
        case 2:
          gl.uniform2fv(uniform._uniform, uniform._value);
          break;
        case 3:
          gl.uniform3fv(uniform._uniform, uniform._value);
          break;
        case 4:
          gl.uniform4fv(uniform._uniform, uniform._value);
          break;
      }
    }
  }

  markActive(frameId) {
    if (this._activeFrameId != frameId) {
      this._activeFrameId = frameId;
      this._completeForActiveFrame = true;
      for (let i = 0; i < this._samplers.length; ++i) {
        let sampler = this._samplers[i];
        if (sampler._renderTexture) {
          if (!sampler._renderTexture._complete) {
            this._completeForActiveFrame = false;
            break;
          }
          sampler._renderTexture.markActive(frameId);
        }
      }
    }
    return this._completeForActiveFrame;
  }

  // Material State fetchers
  get cullFace() {
    return !!(this._state & CAP.CULL_FACE);
  }
  get blend() {
    return !!(this._state & CAP.BLEND);
  }
  get depthTest() {
    return !!(this._state & CAP.DEPTH_TEST);
  }
  get stencilTest() {
    return !!(this._state & CAP.STENCIL_TEST);
  }
  get colorMask() {
    return !!(this._state & CAP.COLOR_MASK);
  }
  get depthMask() {
    return !!(this._state & CAP.DEPTH_MASK);
  }
  get stencilMask() {
    return !!(this._state & CAP.STENCIL_MASK);
  }
  get depthFunc() {
    return (
      ((this._state & MAT_STATE.DEPTH_FUNC_RANGE) >>
        MAT_STATE.DEPTH_FUNC_SHIFT) +
      GL.NEVER
    );
  }
  get blendFuncSrc() {
    return stateToBlendFunc(
      this._state,
      MAT_STATE.BLEND_SRC_RANGE,
      MAT_STATE.BLEND_SRC_SHIFT
    );
  }
  get blendFuncDst() {
    return stateToBlendFunc(
      this._state,
      MAT_STATE.BLEND_DST_RANGE,
      MAT_STATE.BLEND_DST_SHIFT
    );
  }

  // Only really for use from the renderer
  _capsDiff(otherState) {
    return (
      (otherState & MAT_STATE.CAPS_RANGE) ^ (this._state & MAT_STATE.CAPS_RANGE)
    );
  }

  _blendDiff(otherState) {
    if (!(this._state & CAP.BLEND)) {
      return 0;
    }
    return (
      (otherState & MAT_STATE.BLEND_FUNC_RANGE) ^
      (this._state & MAT_STATE.BLEND_FUNC_RANGE)
    );
  }

  _depthFuncDiff(otherState) {
    if (!(this._state & CAP.DEPTH_TEST)) {
      return 0;
    }
    return (
      (otherState & MAT_STATE.DEPTH_FUNC_RANGE) ^
      (this._state & MAT_STATE.DEPTH_FUNC_RANGE)
    );
  }
}

export class Renderer {
  constructor(gl) {
    this._gl = gl || createWebGLContext();
    this._frameId = 0;
    this._programCache = {};
    this._textureCache = {};
    this._renderPrimitives = Array(RENDER_ORDER.DEFAULT);
    this._cameraPositions = [];

    this._vaoExt = gl.createVertexArray();

    let fragHighPrecision = gl.getShaderPrecisionFormat(
      gl.FRAGMENT_SHADER,
      gl.HIGH_FLOAT
    );
    this._defaultFragPrecision =
      fragHighPrecision.precision > 0 ? "highp" : "mediump";

    this._depthMaskNeedsReset = false;
    this._colorMaskNeedsReset = false;

    this._globalLightColor = vec3.clone(DEF_LIGHT_COLOR);
    this._globalLightDir1 = vec3.clone(DEF_LIGHT_DIR1);
    this._globalLightDir2 = vec3.clone(DEF_LIGHT_DIR2);
  }

  get gl() {
    return this._gl;
  }

  set globalLightColor(value) {
    vec3.copy(this._globalLightColor, value);
  }

  get globalLightColor() {
    return vec3.clone(this._globalLightColor);
  }

  set globalLightDir1(value1) {
    vec3.copy(this._globalLightDir1, value1);
  }

  set globalLightDir2(value2) {
    vec3.copy(this._globalLightDir2, value2);
  }

  get globalLightDir1() {
    return vec3.clone(this._globalLightDir1);
  }

  get globalLightDir2() {
    return vec3.clone(this._globalLightDir2);
  }

  createRenderBuffer(target, data, usage) {
    if (usage === undefined) usage = GL.STATIC_DRAW;
    let gl = this._gl;
    let glBuffer = gl.createBuffer();

    if (data instanceof Promise) {
      let renderBuffer = new RenderBuffer(
        target,
        usage,
        data.then((data) => {
          gl.bindBuffer(target, glBuffer);
          gl.bufferData(target, data, usage);
          renderBuffer._length = data.byteLength;
          return glBuffer;
        })
      );
      return renderBuffer;
    } else {
      gl.bindBuffer(target, glBuffer);
      gl.bufferData(target, data, usage);
      return new RenderBuffer(target, usage, glBuffer, data.byteLength);
    }
  }

  updateRenderBuffer(buffer, data, offset = 0) {
    if (buffer._buffer) {
      let gl = this._gl;
      gl.bindBuffer(buffer._target, buffer._buffer);
      if (offset == 0 && buffer._length == data.byteLength) {
        gl.bufferData(buffer._target, data, buffer._usage);
      } else {
        gl.bufferSubData(buffer._target, offset, data);
      }
    } else {
      buffer.waitForComplete().then((buffer) => {
        this.updateRenderBuffer(buffer, data, offset);
      });
    }
  }

  createRenderPrimitive(primitive, material) {
    let renderPrimitive = new RenderPrimitive(primitive);

    let program = this._getMaterialProgram(material, renderPrimitive);
    let renderMaterial = new RenderMaterial(this, material, program);
    renderPrimitive.setRenderMaterial(renderMaterial);

    if (!this._renderPrimitives[renderMaterial._renderOrder]) {
      this._renderPrimitives[renderMaterial._renderOrder] = [];
    }

    this._renderPrimitives[renderMaterial._renderOrder].push(renderPrimitive);

    return renderPrimitive;
  }

  createMesh(primitive, material) {
    let meshNode = new Node();
    meshNode.addRenderPrimitive(
      this.createRenderPrimitive(primitive, material)
    );
    return meshNode;
  }

  drawViews(views, rootNode, time) {
    if (!rootNode) {
      return;
    }

    let gl = this._gl;
    this._frameId++;

    rootNode.markActive(this._frameId);

    // If there's only one view then flip the algorithm a bit so that we're only
    // setting the viewport once.
    if (views.length == 1 && views[0].viewport) {
      let vp = views[0].viewport;
      this._gl.viewport(vp.x, vp.y, vp.width, vp.height);
    }

    // Get the positions of the 'camera' for each view matrix.
    for (let i = 0; i < views.length; ++i) {
      if (this._cameraPositions.length <= i) {
        this._cameraPositions.push(vec3.create());
      }
      let p = views[i].viewTransform.position;
      this._cameraPositions[i][0] = p.x;
      this._cameraPositions[i][1] = p.y;
      this._cameraPositions[i][2] = p.z;

      /*mat4.invert(inverseMatrix, views[i].viewMatrix);
      let cameraPosition = this._cameraPositions[i];
      vec3.set(cameraPosition, 0, 0, 0);
      vec3.transformMat4(cameraPosition, cameraPosition, inverseMatrix);*/
    }

    // Draw each set of render primitives in order
    for (let renderPrimitives of this._renderPrimitives) {
      if (renderPrimitives && renderPrimitives.length) {
        this._drawRenderPrimitiveSet(views, renderPrimitives);
      }
    }
 
    if (this._vaoExt) {
      this._gl.bindVertexArray(null);
    }

    if (this._depthMaskNeedsReset) {
      gl.depthMask(true);
    }
    if (this._colorMaskNeedsReset) {
      gl.colorMask(true, true, true, true);
    }

    renderList.initBuffer(this._gl);
    // renderList.setTextureCatalogue(window.textureCatalogue);
    renderList.beginFrame();
    renderListScene(time);
    if (renderList.num > 0) {
      console.log('-------------------');
      for(let i = 0; i < renderList.num; i ++) {
        this._drawRenderListPrimitive(views, ...renderList.endFrame(i));
        // console.log(...renderList.endFrame(i));
      }  
    }
  }

  _drawRenderPrimitiveSet(views, renderPrimitives) {
    let gl = this._gl;
    let program = null;
    let material = null;

    // Loop through every primitive known to the renderer.
    for (let primitive of renderPrimitives) {
      // Skip over those that haven't been marked as active for this frame.
      if (primitive._activeFrameId != this._frameId) {
        continue;
      }

      // Bind the primitive material's program if it's different than the one we
      // were using for the previous primitive.
      // TODO: The ording of this could be more efficient.
      if (program != primitive._material._program) {
        program = primitive._material._program;
        program.use();

        if (program.uniform.LIGHT_DIRECTION1) {
          gl.uniform3fv(program.uniform.LIGHT_DIRECTION1, this._globalLightDir1);
        }

        if (program.uniform.LIGHT_DIRECTION2) {
          gl.uniform3fv(program.uniform.LIGHT_DIRECTION2, this._globalLightDir2);
        }

        if (program.uniform.LIGHT_COLOR) {
          gl.uniform3fv(program.uniform.LIGHT_COLOR, this._globalLightColor);
        }

        if (views.length == 1) {
          gl.uniformMatrix4fv(
            program.uniform.PROJECTION_MATRIX,
            false,
            views[0].projectionMatrix
          );
          gl.uniformMatrix4fv(
            program.uniform.VIEW_MATRIX,
            false,
            views[0].viewMatrix
          );
          gl.uniform3fv(
            program.uniform.CAMERA_POSITION,
            this._cameraPositions[0]
          );
          gl.uniform1i(program.uniform.EYE_INDEX, views[0].eyeIndex);
        }
      }

      if (material != primitive._material) {
        this._bindMaterialState(primitive._material, material);
        primitive._material.bind(gl, program, material);
        material = primitive._material;
      }

      if (this._vaoExt) {
        if (primitive._vao) {
          this._gl.bindVertexArray(primitive._vao);
        } else {
          primitive._vao = gl.createVertexArray();
          this._gl.bindVertexArray(primitive._vao);
          this._bindPrimitive(primitive);
        }
      } else {
       this._bindPrimitive(primitive, attribMask);
        attribMask = primitive._attributeMask;
      }

      for (let i = 0; i < views.length; ++i) {
        let view = views[i];
        if (views.length > 1) {
          if (view.viewport) {
            let vp = view.viewport;
            gl.viewport(vp.x, vp.y, vp.width, vp.height);
          }
          gl.uniformMatrix4fv(
            program.uniform.PROJECTION_MATRIX,
            false,
            view.projectionMatrix
          );
          gl.uniformMatrix4fv(
            program.uniform.VIEW_MATRIX,
            false,
            view.viewMatrix
          );
          gl.uniform3fv(
            program.uniform.CAMERA_POSITION,
            this._cameraPositions[i]
          );
          gl.uniform1i(program.uniform.EYE_INDEX, view.eyeIndex);
        }

        for (let instance of primitive._instances) {
          if (instance._activeFrameId != this._frameId) {
            continue;
          }

          gl.uniformMatrix4fv(
            program.uniform.MODEL_MATRIX,
            false,
            instance.worldMatrix
          );

          if (primitive._indexBuffer) {
            gl.drawElements(
              primitive._mode,
              primitive._elementCount,
              primitive._indexType,
              primitive._indexByteOffset
            );
          } else {
            gl.drawArrays(primitive._mode, 0, primitive._elementCount);
          } 
        }
      }
    }
  }

  _drawRenderListPrimitive(views, renderList, shape, matrix, color, opacity, textureInfo, fxMode, triangleMode, isToon, isMirror, isParticles) {
    let gl = this._gl;
    if(!renderList.program) {
      renderList.program = new Program(gl, RenderList_VERTEX_SOURCE, RenderList_FRAG_SOURCE);
      // await loadImages(gl);
    }
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderList.program.use();
    let pgm = renderList.program;

    let drawArrays = () => {
      gl.drawArrays(
        triangleMode == 1 ? gl.TRIANGLES : gl.TRIANGLE_STRIP,
        0,
        shape.length / VERTEX_SIZE
      );
    }
if (false) {
    console.log('1', views);
    console.log('2', renderList);
    console.log('3', shape);
    console.log('4', matrix);
    console.log('5', color);
    console.log('6', opacity);
    console.log('7', textureInfo);
    console.log('8', fxMode);
    console.log('9', triangleMode);
    console.log('10', isToon);
    console.log('11', isMirror);
    console.log('12', isParticles);
}
    gl.uniform1f(gl.getUniformLocation(pgm.program, "uParticles"), isParticles ? 1 : 0);

    if(!renderList.vao) {
      renderList.initVAO(gl);
      gl.bindVertexArray(renderList.vao);
      gl.useProgram(pgm.program);
      renderList.buffer = gl.createBuffer();
    }
   // if (shape != renderList.prev_shape) {
      renderList.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, renderList.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shape), gl.DYNAMIC_DRAW);
      let bpe = Float32Array.BYTES_PER_ELEMENT;

      let aPos = gl.getAttribLocation(pgm.program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 0);

      let aNor = gl.getAttribLocation(pgm.program, 'aNor');
      gl.enableVertexAttribArray(aNor);
      gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 3);

      let aTan = gl.getAttribLocation(pgm.program, 'aTan');
      gl.enableVertexAttribArray(aTan);
      gl.vertexAttribPointer(aTan, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 6);

      let aUV = gl.getAttribLocation(pgm.program, 'aUV');
      gl.enableVertexAttribArray(aUV);
      gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 9);

      let aRGB = gl.getAttribLocation(pgm.program, 'aRGB');
      gl.enableVertexAttribArray(aRGB);
      gl.vertexAttribPointer(aRGB, 3, gl.FLOAT, false, bpe * VERTEX_SIZE, bpe * 11);

      renderList.bufferAux = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, renderList.bufferAux);
    // }
   
    gl.uniform1f(gl.getUniformLocation(pgm.program, "uBrightness"), 1.0);
    gl.uniform4fv(
      gl.getUniformLocation(pgm.program, "uColor"),
      color.length == 4
        ? color
        : color.concat([opacity === undefined ? 1 : opacity])
    );
    gl.uniformMatrix4fv(
      gl.getUniformLocation(pgm.program, "uModel"),
      false,
      matrix
    );
    gl.uniform1i(gl.getUniformLocation(pgm.program, "uFxMode"), fxMode);
    gl.uniform3fv(
      gl.getUniformLocation(pgm.program, "uWindowDir"),
      this._globalLightDir1
    );

    let uTex = [];
    for (let n = 0; n < gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS); n++) {
      uTex[n] = gl.getUniformLocation(pgm.program, 'uTex' + n);
      gl.uniform1i(uTex[n], n);
    }

    if (textureInfo.isValid) {
      gl.uniform1i(gl.getUniformLocation(pgm.program, "uTexIndex"), 0);

      // base texture : 0
      // bump texture : 1
      // ...
      for (let i = 0; i < textureInfo.textures.length; i += 1) {
        gl.uniform1f(gl.getUniformLocation(pgm.program, "uTexScale"), textureInfo.scale);

        // if (renderList.textureCatalogue.slotToTextureID(i) != textureInfo.textures[i].ID) {
          renderList.textureCatalogue.setSlotByTextureInfo(textureInfo.textures[i], i);
        // }
      }
      gl.uniform1i(gl.getUniformLocation(pgm.program, "uBumpIndex"), (textureInfo.textures.length > 1) ? 0 : -1);

    } else {
    gl.uniform1i(gl.getUniformLocation(pgm.program, "uBumpIndex"), -1);
    gl.uniform1i(gl.getUniformLocation(pgm.program, "uTexIndex"), -1);
    }

    if (views.length == 1) {
      gl.uniformMatrix4fv(
        gl.getUniformLocation(pgm.program, "uProj"),
        false,
        views[0].projectionMatrix
      );
      gl.uniformMatrix4fv(
        gl.getUniformLocation(pgm.program, "uView"),
        false,
        views[0].viewMatrix
      );
    }

    for (let i = 0; i < views.length; ++i) {
      let view = views[i];
      if (views.length > 1) {
        let vp = view.viewport;
        gl.viewport(vp.x, vp.y, vp.width, vp.height);
        gl.uniformMatrix4fv(
          gl.getUniformLocation(pgm.program, "uView"),
          false,
          view.viewMatrix
        );
        gl.uniformMatrix4fv(
          gl.getUniformLocation(pgm.program, "uProj"),
          false,
          view.projectionMatrix
        );
      }
      if (isToon) {
        gl.uniform1f(
          gl.getUniformLocation(pgm.program, "uToon"),
          0.005 * CG.norm(m.value().slice(0, 3))
        );
        gl.cullFace(gl.FRONT);
        drawArrays();
        gl.cullFace(gl.BACK);
        gl.uniform1f(gl.getUniformLocation(pgm.program, "uToon"), 0);
      }
      if (isMirror) gl.cullFace(gl.FRONT);
      drawArrays();
    }
    gl.cullFace(gl.BACK);
    renderList.prev_shape = shape;
  }

  _getRenderTexture(texture) {
    if (!texture) {
      return null;
    }

    let key = texture.textureKey;
    if (!key) {
      throw new Error("Texure does not have a valid key");
    }

    if (key in this._textureCache) {
      return this._textureCache[key];
    } else {
      let gl = this._gl;
      let textureHandle = gl.createTexture();

      let renderTexture = new RenderTexture(textureHandle);
      this._textureCache[key] = renderTexture;

      if (texture instanceof DataTexture) {
        gl.bindTexture(gl.TEXTURE_2D, textureHandle);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          texture.format,
          texture.width,
          texture.height,
          0,
          texture.format,
          texture._type,
          texture._data
        );
        this._setSamplerParameters(texture);
        renderTexture._complete = true;
      } else {
        texture.waitForComplete().then(() => {
          gl.bindTexture(gl.TEXTURE_2D, textureHandle);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            texture.format,
            texture.format,
            gl.UNSIGNED_BYTE,
            texture.source
          );
          this._setSamplerParameters(texture);
          renderTexture._complete = true;

          if (texture instanceof VideoTexture) {
            // Once the video starts playing, set a callback to update it's
            // contents each frame.
            texture._video.addEventListener("playing", () => {
              renderTexture._activeCallback = () => {
                if (!texture._video.paused && !texture._video.waiting) {
                  gl.bindTexture(gl.TEXTURE_2D, textureHandle);
                  gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    texture.format,
                    texture.format,
                    gl.UNSIGNED_BYTE,
                    texture.source
                  );
                }
              };
            });
          }
        });
      }

      return renderTexture;
    }
  }

  _setSamplerParameters(texture) {
    let gl = this._gl;

    let sampler = texture.sampler;
    let powerOfTwo =
      isPowerOfTwo(texture.width) && isPowerOfTwo(texture.height);
    let mipmap = powerOfTwo && texture.mipmap;
    if (mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    let minFilter =
      sampler.minFilter || (mipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    let wrapS = sampler.wrapS || (powerOfTwo ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    let wrapT = sampler.wrapT || (powerOfTwo ? gl.REPEAT : gl.CLAMP_TO_EDGE);

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      sampler.magFilter || gl.LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  }

  _getProgramKey(name, defines) {
    let key = `${name}:`;

    for (let define in defines) {
      key += `${define}=${defines[define]},`;
    }

    return key;
  }

  _getMaterialProgram(material, renderPrimitive) {
    let materialName = material.materialName;
    let vertexSource = material.vertexSource;
    let fragmentSource = material.fragmentSource;

    // These should always be defined for every material
    if (materialName == null) {
      throw new Error("Material does not have a name");
    }
    if (vertexSource == null) {
      throw new Error(
        `Material "${materialName}" does not have a vertex source`
      );
    }
    if (fragmentSource == null) {
      throw new Error(
        `Material "${materialName}" does not have a fragment source`
      );
    }

    let defines = material.getProgramDefines(renderPrimitive);
    let key = this._getProgramKey(materialName, defines);

    if (key in this._programCache) {
      return this._programCache[key];
    } else {
      let multiview = false; // Handle this dynamically later
      let fullVertexSource = vertexSource;
      fullVertexSource += multiview
        ? VERTEX_SHADER_MULTI_ENTRY
        : VERTEX_SHADER_SINGLE_ENTRY;

      let precisionMatch = fragmentSource.match(PRECISION_REGEX);
      let fragPrecisionHeader = precisionMatch
        ? ""
        : `precision ${this._defaultFragPrecision} float;\n`;

      let fullFragmentSource = fragPrecisionHeader + fragmentSource;
      fullFragmentSource += FRAGMENT_SHADER_ENTRY;

      let program = new Program(
        this._gl,
        fullVertexSource,
        fullFragmentSource,
        ATTRIB,
        defines
      );
      this._programCache[key] = program;

      program.onNextUse((program) => {
        // Bind the samplers to the right texture index. This is constant for
        // the lifetime of the program.
        for (let i = 0; i < material._samplers.length; ++i) {
          let sampler = material._samplers[i];
          let uniform = program.uniform[sampler._uniformName];
          if (uniform) {
            this._gl.uniform1i(uniform, i);
          }
        }
      });

      return program;
    }
  }

  _bindPrimitive(primitive, attribMask) {
    let gl = this._gl;

    // If the active attributes have changed then update the active set.
    if (attribMask != primitive._attributeMask) {
      for (let attrib in ATTRIB) {
        if (primitive._attributeMask & ATTRIB_MASK[attrib]) {
          gl.enableVertexAttribArray(ATTRIB[attrib]);
        } else {
          gl.disableVertexAttribArray(ATTRIB[attrib]);
        }
      }
    }

    // Bind the primitive attributes and indices.
    for (let attributeBuffer of primitive._attributeBuffers) {
      gl.bindBuffer(gl.ARRAY_BUFFER, attributeBuffer._buffer._buffer);
      for (let attrib of attributeBuffer._attributes) {
        gl.vertexAttribPointer(
          attrib._attrib_index,
          attrib._componentCount,
          attrib._componentType,
          attrib._normalized,
          attrib._stride,
          attrib._byteOffset
        );
      }
    }

    if (primitive._indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive._indexBuffer._buffer);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }

  _bindMaterialState(material, prevMaterial = null) {
    let gl = this._gl;

    let state = material._state;
    let prevState = prevMaterial ? prevMaterial._state : ~state;

    // Return early if both materials use identical state
    if (state == prevState) {
      return;
    }

    // Any caps bits changed?
    if (material._capsDiff(prevState)) {
      setCap(gl, gl.CULL_FACE, CAP.CULL_FACE, prevState, state);
      setCap(gl, gl.BLEND, CAP.BLEND, prevState, state);
      setCap(gl, gl.DEPTH_TEST, CAP.DEPTH_TEST, prevState, state);
      setCap(gl, gl.STENCIL_TEST, CAP.STENCIL_TEST, prevState, state);

      let colorMaskChange =
        (state & CAP.COLOR_MASK) - (prevState & CAP.COLOR_MASK);
      if (colorMaskChange) {
        let mask = colorMaskChange > 1;
        this._colorMaskNeedsReset = !mask;
        gl.colorMask(mask, mask, mask, mask);
      }

      let depthMaskChange =
        (state & CAP.DEPTH_MASK) - (prevState & CAP.DEPTH_MASK);
      if (depthMaskChange) {
        this._depthMaskNeedsReset = !(depthMaskChange > 1);
        gl.depthMask(depthMaskChange > 1);
      }

      let stencilMaskChange =
        (state & CAP.STENCIL_MASK) - (prevState & CAP.STENCIL_MASK);
      if (stencilMaskChange) {
        gl.stencilMask(stencilMaskChange > 1);
      }
    }

    // Blending enabled and blend func changed?
    if (material._blendDiff(prevState)) {
      gl.blendFunc(material.blendFuncSrc, material.blendFuncDst);
    }

    // Depth testing enabled and depth func changed?
    // if (material._depthFuncDiff(prevState)) {
    //   gl.depthFunc(material.depthFunc);
    // }
  }
}
