import { materials } from "./materials.js";
import { matrix_inverse, matrix_perspective } from "./implicitSurface.js";
import { VERTEX_SIZE } from "../../core/CG.js";

export function setUniform(gl, pgm, type, name, a, b, c, d, e, f) {
   let loc = gl.getUniformLocation(pgm.program, name);
   (gl['uniform' + type])(loc, a, b, c, d, e, f);
}

export let drawMesh = (m, gl, pgm, mesh, materialId, isTriangleMesh) => {
   setUniform(gl, pgm, '1f', 'uOpacity', 1);
   // setUniform(gl, pgm, 'Matrix4fv', 'uView', false, matrix_perspective(3)); // SET GPU CAMERA
   setUniform(gl, pgm, 'Matrix4fv', 'uModel', false, m);
   // setUniform(gl, pgm, 'Matrix4fv', 'uInvMatrix', false, matrix_inverse(m));

   let material = materials[materialId];
   let a = material.ambient, d = material.diffuse, s = material.specular;
   setUniform(gl, pgm, 'Matrix4fv', 'uPhong', false, [a[0],a[1],a[2],0, d[0],d[1],d[2],0, s[0],s[1],s[2],s[3], 0,0,0,0]);

   gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
   gl.drawArrays(isTriangleMesh ? gl.TRIANGLES : gl.TRIANGLE_STRIP, 0, mesh.length / VERTEX_SIZE);
}

