"use strict"

export class SubTextureHandle {
    constructor() {
        this.ID    = 0;
        this.subID = 0;
        this.name  = "";
        
        this.u = 0;
        this.v = 0;

        this.uFrac = 0;
        this.vFrac = 0;

        this.w = 0;
        this.h = 0;
    }

    equals(other) {
        return this.ID    == other.ID &&
               this.subID == other.subID;
    }
}
export class TextureHandle {
    constructor() {
        this.ID          = 0;
        this.name        = null;
        this.resource    = null;
        this.slot        = -1;
        this.subTextures = [];
        this.mapNameToSubTexture = new Map();
        this.w = 0;
        this.h = 0;

        this.activeCount = 0;
    }

    lookupImageByName(name) {
        if (this.mapNameToSubTexture.has(name)) {
            const ID = this.mapNameToSubTexture.get(name);
            return this.subTextures[ID - 1];
        }
        return null;
    }

    lookupImageByID(ID) {
        if (this.subTextures.length < ID) {
            return null;
        }

        return this.subTextures[ID - 1];
    }

    equals(other) {
        return this.ID == other.ID;
    }
}

export function deleteTexture2D(catalogue, textureInfo) {

    // 0 is the null ID
    if (textureInfo.ID <= 0) {
        return false;
    }

    textureInfo.subTextures = [];

    const gl = catalogue.gl;

    gl.deleteTexture(textureInfo.resource);

    return true;
}


export function registerTextureToCatalogue(catalogue, descriptor) {
    console.log("registerTextureToCatalogue");
    const ID = getNextAvailID(catalogue);

    while (catalogue.textures.length < ID) {
        catalogue.textures.push(new TextureHandle());
    }

    const texHandle = catalogue.textures[ID - 1];

    texHandle.ID = ID;
    texHandle.name = descriptor.name || texHandle.ID.toString();

    catalogue.mapNameToTexture.set(texHandle.name, ID);

    texHandle.resource = catalogue.gl.createTexture();
    // var img = new Uint8Array([ 255, 0, 0, 255 ]);
    // for (var i = 2; i < catalogue.gl.getParameter(catalogue.gl.MAX_TEXTURE_IMAGE_UNITS); i++) {
    // catalogue.gl.activeTexture(catalogue.gl.TEXTURE0 + 2);
    // catalogue.gl.bindTexture(catalogue.gl.TEXTURE_2D, texHandle.resource);
    // catalogue.gl.texImage2D(catalogue.gl.TEXTURE_2D, 0, catalogue.gl.RGBA, 1, 1, 0, catalogue.gl.RGBA, catalogue.gl.UNSIGNED_BYTE, img);
    // }
    return texHandle;
}

// TODO deletion - commented-out code uses non-existent fields from before some changes
// function deleteTextureFromCatalogueByID(catalogue, ID) {
//     const tex = catalogue.mapIDToSubTexture.get(ID);
//     catalogue.mapIDToTexture.delete(tex.ID);
//     catalogue.mapNameToTexture.delete(tex.name);
//     catalogue.freeIDs.push(ID);

//     if (catalogue.mapIDToSlot.has(ID)) {
//         catalogue.mapIDToSlot.delete(ID);
//     }

//     deleteTexture2D(catalogue, tex);
// }
// function deleteTextureFromCatalogueByName(catalogue, name) {
//     const tex = catalogue.mapNameToTexture.get(name);
//     catalogue.mapNameToTexture.delete(tex.name);    
//     catalogue.mapIDToTexture.delete(tex.ID);
//     catalogue.mapIDToSlot.delete(tex.ID);

//     if (catalogue.mapIDToSlot.has(ID)) {
//         catalogue.mapIDToSlot.delete(ID);
//     }
// }

export class TextureCatalogue {
    constructor(gl, w = 2048, h = 2048) {
        this.mapNameToTexture = new Map();
        this.mapIDToSlot = new Map();

        this.freeIDs = [];

        this.canvas    = document.createElement('canvas');
        this.canvas.id = "TextureCatalogue";
        this.canvas.zIndex = 10000;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.canvas.width  = w;
        this.canvas.height = h;

        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 0.0;
        this.ctx.fillStyle = 'black';
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;

        this.textures = [];

        this.nextAvailID = 1;

        this.gl = gl;

        this.slotToID = [];
        
        const MAX_TEXTURE_IMAGE_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        for (let i = 0; i < MAX_TEXTURE_IMAGE_UNITS; i += 1) {
            this.slotToID.push(0);
        }



        this.slotToGeneration = [];
        for (let i = 0; i < MAX_TEXTURE_IMAGE_UNITS; i += 1) {
            this.slotToGeneration.push(0);
        }
    }

    lookupByName(name) {
        const ID = this.mapNameToTexture.get(name);
        return this.lookupByID(ID);
    }
    lookupByID(ID) {
        if (ID > this.textures.length) {
            return null;
        }
        return this.textures[ID - 1];
    }

    setSlotByTextureInfo(tex, slot) {
        if (tex.slot == slot && tex.activeCount == this.slotToGeneration[slot]) {
            return;
        }

        tex.slot = slot;
        this.gl.activeTexture(this.gl.TEXTURE0 + slot);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex.resource);


        this.slotToID[slot] = tex.ID;

        this.slotToGeneration[slot] += 1;
        tex.activeCount += 1;

        return tex;
    }

    setSlotByID(ID, slot) {

        const tex = this.lookupByID(ID);
        if (tex.slot == slot && tex.activeCount == this.slotToGeneration[slot]) {
            return;
        }

        tex.slot = slot;

        this.gl.activeTexture(gl.TEXTURE0 + slot + 2);
        this.gl.bindTexture(gl.TEXTURE_2D, tex.resource);

        this.slotToID[slot] = ID;

        this.slotToGeneration[slot] += 1;
        tex.activeCount += 1;

        return tex;
    }

    slotToTextureID(slot) {
        return this.slotToID[slot];
    }

    registerTextureToCatalogue(descriptor) {
        return registerTextureToCatalogue(this, descriptor);
    }

    // removeTextureFromCatalogueByID(ID) {
    //     return removeTextureFromCatalogueByID(this, ID);
    // }

    // removeTextureFromCatalogueByName(name) {
    //     return removeTextureFromCatalogueByName(this, name);
    // }

    deinit() {
        this.canvas.width = 0;
        this.canvas.height = 0
        this.canvas = null;
    }
}

export function getNextAvailID(catalogue) {
    if (catalogue.freeIDs.length > 0) {
        return catalogue.freeIDs.pop();
    }

    catalogue.nextAvailID += 1;
    return catalogue.nextAvailID - 1;
}


export function makeSubTexture(catalogue, texHandle, srcName, u, v, w, h) {
    const subTexture = new SubTextureHandle();
    texHandle.subTextures.push(subTexture);
        
    subTexture.ID    = texHandle.ID;
    subTexture.subID = texHandle.subTextures.length;

    subTexture.name  = srcName || subTexture.subID.toString();
        
    subTexture.u = u;
    subTexture.v = v;

    subTexture.w = w;
    subTexture.h = h;

    subTexture.uFrac = subTexture.u / subTexture.w;
    subTexture.vFrac = subTexture.v / subTexture.h;

    texHandle.mapNameToSubTexture.set(srcName, subTexture.subID);

    return subTexture;
}




// catalogue:
//      texture catalogue storing info about textures
// descriptor: 
//     settings for the texture
// srcList: 
//     list of images to put into the texture
// padding: 
//     number of transparent pixels with 
//     which to surround an individual subtexture to avoid undesired blending
//     (default = 8)
export function makePackedTexture2DWithImages(catalogue, descriptor, slot, srcList, srcNameList, padding = 0, cornerWhite = false) {
    if (!descriptor) {
        throw new Error("texture descriptor not provided");
    }

    if (srcList.length != srcNameList.length) {
        throw new Error("source image and source image name input lengths do not match");
    }

    const gl = catalogue.gl;

    const texHandle = registerTextureToCatalogue(catalogue, descriptor);

    catalogue.setSlotByTextureInfo(texHandle, slot);


    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texHandle.resource);

    for (let i = 0; i < descriptor.paramList.length; i += 1) {
        gl.texParameteri(gl.TEXTURE_2D, descriptor.paramList[i][0], descriptor.paramList[i][1]);
    }


    // pack the textures
    {
        // taken from:
        // https://github.com/mapbox/potpack

   
        function potpack(boxes) {

            // calculate total box area and maximum box width
            let area = 0;
            let maxWidth = 0;

            for (const box of boxes) {
                area += box.w * box.h;
                maxWidth = Math.max(maxWidth, box.w);
            }

            // sort the boxes for insertion by height, descending
            boxes.sort((a, b) => b.h - a.h);

            // aim for a squarish resulting container,
            // slightly adjusted for sub-100% space utilization
            const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

            // start with a single empty space, unbounded at the bottom
            const spaces = [{x: 0, y: 0, w: startWidth, h: Infinity}];

            let width = 0;
            let height = 0;

            for (const box of boxes) {
                // look through spaces backwards so that we check smaller spaces first
                for (let i = spaces.length - 1; i >= 0; i--) {
                    const space = spaces[i];

                    // look for empty spaces that can accommodate the current box
                    if (box.w > space.w || box.h > space.h) continue;

                    // found the space; add the box to its top-left corner
                    // |-------|-------|
                    // |  box  |       |
                    // |_______|       |
                    // |         space |
                    // |_______________|
                    box.x = space.x;
                    box.y = space.y;

                    height = Math.max(height, box.y + box.h);
                    width = Math.max(width, box.x + box.w);

                    if (box.w === space.w && box.h === space.h) {
                        // space matches the box exactly; remove it
                        const last = spaces.pop();
                        if (i < spaces.length) spaces[i] = last;

                    } else if (box.h === space.h) {
                        // space matches the box height; update it accordingly
                        // |-------|---------------|
                        // |  box  | updated space |
                        // |_______|_______________|
                        space.x += box.w;
                        space.w -= box.w;

                    } else if (box.w === space.w) {
                        // space matches the box width; update it accordingly
                        // |---------------|
                        // |      box      |
                        // |_______________|
                        // | updated space |
                        // |_______________|
                        space.y += box.h;
                        space.h -= box.h;

                    } else {
                        // otherwise the box splits the space into two spaces
                        // |-------|-----------|
                        // |  box  | new space |
                        // |_______|___________|
                        // | updated space     |
                        // |___________________|
                        spaces.push({
                            x: space.x + box.w,
                            y: space.y,
                            w: space.w - box.w,
                            h: box.h
                        });
                        space.y += box.h;
                        space.h -= box.h;
                    }
                    break;
                }
            }



            
            return {
                w: width, // container width
                h: height, // container height
                fill: (area / (width * height)) || 0 // space utilization
            };
        }
 
        {
            const boxes = [];
            for (let i = 0; i < srcList.length; i += 1) {
                boxes.push({
                    w : srcList[i].width  + padding,
                    h : srcList[i].height + padding,
                    i : i,
                });

            }

            const packed = potpack(boxes);


            let resized = false;

            // taken from:
            // https://www.geeksforgeeks.org/smallest-power-of-2-greater-than-or-equal-to-n/
            function nextPowerOf2(n)  {
                n--; 
                n |= n >> 1; 
                n |= n >> 2; 
                n |= n >> 4; 
                n |= n >> 8; 
                n |= n >> 16; 
                n++; 
                return n; 
            }


            if (cornerWhite) {
                packed.w = nextPowerOf2(packed.w + padding + 1);
                packed.h = nextPowerOf2(packed.h + padding + 1);
            } else {
                packed.w = nextPowerOf2(packed.w);
                packed.h = nextPowerOf2(packed.h);                
            }

            const canvas = catalogue.canvas;

            if (canvas.width < packed.w) {
                canvas.width = packed.w;
                resized = true;
            }
            if (canvas.height < packed.h) {
                canvas.height = packed.h;
                resized = true;
            }

            if (srcList.length == 1) {
                catalogue.canvas.width  = srcList[0].width;
                catalogue.canvas.height = srcList[0].height;
            }

            const ctx = catalogue.ctx;
            
            if (resized) {
                ctx.rect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 0.0;
                ctx.fillStyle = 'black';
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
            ctx.globalAlpha = 1.0;

            let offset = 0;
            if (cornerWhite) {
                offset = padding + 4;
                
                ctx.fillStyle = "white"
                ctx.fillRect(0, 0, 4, 4);
            }

            for (let i = 0; i < boxes.length; i += 1) {
                ctx.drawImage(srcList[boxes[i].i], boxes[i].x + offset, boxes[i].y + offset);
                makeSubTexture(
                    catalogue,
                    texHandle,
                    srcNameList[i],
                    boxes[i].x,
                    boxes[i].y,
                    srcList[i].width, 
                    srcList[i].height
                );                
            }
        }
    }

    gl.texImage2D(
        gl.TEXTURE_2D,
        descriptor.detailLevel,
        descriptor.internalFormat,
        descriptor.format,
        descriptor.type,
        catalogue.canvas
    );

    if (descriptor.generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    texHandle.w = catalogue.canvas.width;
    texHandle.h = catalogue.canvas.height;

    return texHandle;
}

export function makeIndividualTexture2DsWithImages(catalogue, descriptor, slots, srcList, srcNameList) {

    const out = [];

    for (let i = 0; i < srcList.length; i += 1) {
        descriptor.name = srcNameList[i];
        out.push(
            makePackedTexture2DWithImages(
                catalogue,
                descriptor,
                slots[i],
                [srcList[i]],
                [srcNameList[i]]
            )
        );
    }
    return out;
}

// returns a default-initialized texture 2D descriptor
export function makeTexture2DDescriptor(gl) {
    return  {
        detailLevel    : 0,
        internalFormat : gl.RGBA,
        format         : gl.RGBA,
        type           : gl.UNSIGNED_BYTE,
        generateMipmap : false,
        width          : 0,
        height         : 0,
        border         : 0,
        name           : null,
        paramList      : [],
        slot           : 0
    };
}
