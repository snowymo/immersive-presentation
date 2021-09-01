"use strict";

// import { posY } from "../render/scenes/demoSyncTest.js"
import { onPress, onDrag, onRelease } from "../render/core/renderListScene.js";

// ZH: process controller input, as an event, for local or remote source

export function left_controller_trigger(operation, id) {
    // console.log("in left_controller_trigger", operation);
    if (window["demoSyncTestState"] == 1) {
        console.log("demoSyncTestState");
        if (operation == "press")
            window.posY += 0.1;
    }
    if (operation == "press") {
        onPress("left", 0, id);
    } else if (operation == "drag") {
        onDrag("left", 0, id);
    } else if (operation == "release") {
        onRelease("left", 0, id);
    }
}

export function right_controller_trigger(operation, id) {
    //console.log("right_controller_trigger", operation);
    if (window["demoSyncTestState"] == 1) {
        console.log("demoSyncTestState");
        if (operation == "press")
            window.posY += 0.1;
    }
    if (operation == "press") {
        onPress("right", 0, id);
    } else if (operation == "drag") {
        onDrag("right", 0, id);
    } else if (operation == "release") {
        onRelease("right", 0, id);
    }
}