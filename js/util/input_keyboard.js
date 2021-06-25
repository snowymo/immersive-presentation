"use strict";

import {Queue} from "./queue.js"

const INPUT_TYPE_KEYDOWN = "keydown";
const INPUT_TYPE_KEYUP   = "keyup";

let _keydown = null;
let _keyup = null;

const _keyQueue = new Queue();

let _keypoll = null;

const input = {
    keyPrev : null,
    keyCurr : null,
    isInit  : false
};

export function initKeyEvents(keypoll, doc = document) {
    _keypoll = keypoll;

    input.keyPrev = new Uint8Array(512);
    input.keyCurr = new Uint8Array(512);

    for (let i = 0; i < 512; i += 1) {
        input.keyPrev[i] = 0;
    }
    for (let i = 0; i < 512; i += 1) {
        input.keyCurr[i] = 0;
    }

    if (!input.isInit) {
        doc.addEventListener("keydown", (e) => {
            if (e.target != doc.body) { return; }

            _keyQueue.enqueue(e);

            if (_keydown) {
                _keydown(e);
            }
        }, false);
        doc.addEventListener("keyup", (e) => {
            if (e.target != doc.body) { return; }

            _keyQueue.enqueue(e);

            if (_keyup) {
                _keyup(e);
            }
        }, false);

        input.isInit = true;
    }
};


export function updateKeyState() {
    const keyPrev    = input.keyPrev;
    const keyPrevLen = input.keyPrev.length;
    const keyCurr    = input.keyCurr;

    for (let i = 0; i < keyPrevLen; i += 1) {
        keyPrev[i] = keyCurr[i];
    }

    const Q = _keyQueue;
    const currState = input.keyCurr;
    while (!Q.isEmpty()) {
        const e = Q.dequeue();
        const keyCode = e.keyCode;
        switch (e.type) {
            case INPUT_TYPE_KEYDOWN: {
                keyCurr[keyCode] = 1;
                break;
            }
            case INPUT_TYPE_KEYUP: {
                keyCurr[keyCode] = 0;
                break;
            }
            default: {}
        }
    }
};

export function keyWentDown(code) {
    return !input.keyPrev[code] && input.keyCurr[code];
};
export function keyWentDownNum(code) {
    return (~input.keyPrev[code]) & input.keyCurr[code];
};

export function keyIsDown(code) {
    return input.keyCurr[code];
};
export function keyIsDownNum(code) {
    return input.keyCurr[code];
};
export function keyIsUp(code) {
    return !input.keyCurr[code];
};
export function keyIsUpNum(code) {
    return ~input.keyCurr[code];
};

export function keyWentUp(code) {
    return input.keyPrev[code] && !input.keyCurr[code];
};
export function keyWentUpNum(code) {
    return input.keyPrev[code] & (~input.keyCurr[code]);
};

export function registerKeyDownHandler(handler) {
    _keydown = handler;
}
export function registerKeyUpHandler(handler) {
    _keyup = handler;
}
export function deregisterKeyHandlers() {
    _keydown = null;
    _keyup   = null;
}

export const KEY_LEFT    = 37;
export const KEY_UP      = 38;
export const KEY_RIGHT   = 39;
export const KEY_DOWN    = 40;
export const KEY_A       = 65;
export const KEY_D       = 68;
export const KEY_S       = 83;
export const KEY_W       = 87;
export const KEY_I       = 73;
export const KEY_K       = 75;
export const KEY_J       = 74;
export const KEY_L       = 76;
export const KEY_SPACE   = 32;
