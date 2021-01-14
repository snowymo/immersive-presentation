// this script is about managing the object synchronization, including creating an object that is shared in public

'use strict';

import { Gltf2Node } from '../render/nodes/gltf2.js';
import { mat4, vec3 } from '../render/math/gl-matrix.js';

window.envObjID = 10000;
export function initObject(objectType, objectMatrix, objid=0) {
    // add objects
    // client side: request an ID from the server with curObject: type, transformation
    // server side: send object updates

    window.wsclient.send("objectInit", { type: objectType, matrix: objectMatrix, objid: objid});
}

export function updateObject(objectID, objectMatrix) {
    window.wsclient.send("object",
        {
            id: objectID,
            state:{
                type: window.objects[objectID].type,
                matrix: objectMatrix,
            },            
        });
}

export class SyncObject {
    constructor(id, type = 'nil') {
        this.objid = id;
        this.matrix = mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        this.type = type;
        this.node = null;
        this.draggingTransform = undefined;
        this.draggingInput = undefined;
    }
}