// Convert GLB file to GLTF file.
//
// Instruction: npm convert <name_of_your_glb_or_gltf_file>
// No need to run this file.

import pkg from 'gltf-import-export';
const { ConvertGLBtoGltf, ConvertGltfToGLB, ConvertToGLB } = pkg;

const inputGlb = './examples/PollyCastle/castle_polly_nomad.glb';
const extractedGltfFilename = './examples/PollyCastle/castle_polly_nomad.gltf';

// Perform the conversion; output paths are overwritten
ConvertGLBtoGltf(inputGlb, extractedGltfFilename);

// let gltfContent = fs.readFileSync(extractedGltfFilename, 'utf8');
// let gltf = JSON.parse(gltfContent);

// const outputGlb = 'newfile.glb';

// // Perform the conversion; output path is overwritten
// ConvertToGLB(gltf, extractedGltfFilename, outputGlb);

// const gltfFilename = 'pathtoyour.gltf';

// // optionally if you haven't already parsed the gltf JSON
// ConvertGltfToGLB(gltfFilename, outputGlb);
