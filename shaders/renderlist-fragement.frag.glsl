#version 300 es // NEWER VERSION OF GLSL
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
in vec2 vUV; // U,V


#define LDIR_MAX_COUNT (1)

vec3 Ldir[LDIR_MAX_COUNT];
vec3 Lrgb[LDIR_MAX_COUNT];

uniform int uBumpIndex;
uniform float uBumpScale;
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
  /*
      vec4 texture0 = texture(uTex0, vUV * uTexScale);
      vec4 texture1 = texture(uTex1, vUV * uTexScale);
      vec4 texture2 = texture(uTex2, vUV * uTexScale);
  */
  vec3 ambient = .1 * uColor.rgb;
  vec3 diffuse = .5 * uColor.rgb;
  vec3 specular = vec3(.4, .4, .4);
  float p = 30.;
  float pMet = 40.;

  Ldir[0] = normalize(uWindowDir);
//  Ldir[1] = normalize(uWindowDir);
//  Ldir[2] = normalize(uWindowDir);
//  Ldir[1] = normalize(vec3(-1., -.5, -2.));
//  Ldir[2] = normalize(vec3(-1., 0, 0.5));
  Lrgb[0] = vec3(0.85, .75, .7);
//  Lrgb[1] = vec3(.8, .75, .7);
//  Lrgb[2] = vec3(.1, .15, .2);

  vec3 normal = normalize(vNor);
  vec3 color = ambient;

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
    fragColor = vec4(sqrt(color.rgb) * (uToon == 0. ? 1. : 0.), uColor.a) * uBrightness;
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

    fragColor = vec4(sqrt(color.rgb) * (uToon == 0. ? 1. : 0.), uColor.a) * uBrightness;

    fragColor *= texture(uTex0, vUV);
  }
}
