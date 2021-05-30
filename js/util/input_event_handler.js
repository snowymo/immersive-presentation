"use strict";

// import { posY } from "../render/scenes/demoSyncTest.js"

// ZH: process controller input, as an event, for local or remote source

export function left_controller_trigger(operation) {
    console.log("left_controller_trigger", operation);
    if (window["demoSyncTestState"] == 1) {
        console.log("demoSyncTestState");
        if (operation == "press")
            window.posY += 0.1;
    }
}