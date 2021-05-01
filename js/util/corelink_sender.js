"use strict";

export function corelink_message(type, data) {
    let message;
    switch (type) {
        case "avatar":
            message = {
                type: "avatar",
                user: data,
                ts: Date.now(),
                state: {
                    mtx: window.avatars[data].headset.matrix,
                    pos: window.avatars[data].headset.position,
                    rot: window.avatars[data].headset.orientation,
                    controllers: {
                        left: {
                            mtx: window.avatars[data].leftController.matrix,
                            pos: window.avatars[data].leftController.position,
                            rot: window.avatars[data].leftController.orientation,
                        },
                        right: {
                            mtx: window.avatars[data].rightController.matrix,
                            pos: window.avatars[data].rightController.position,
                            rot: window.avatars[data].rightController.orientation,
                        },
                    },
                },
            };
            break;

        case "webrtc":
            {
                message = {
                    type: "webrtc",
                    uid: window.playerid,
                    state: data,
                    ts: Date.now(),
                };
            }
            // console.log("send webrtc", message);
            break;
        case "object":
            {
                // ZH: object update
                message = {
                    type: "object",
                    ts: Date.now(),
                    uid: window.playerid,
                    id: data["id"],
                    state: data["state"],
                };
            }
            break;
        case "objectInit":
            {
                // ZH: object init
                message = {
                    type: "objectInit",
                    ts: Date.now(),
                    uid: window.playerid,
                    state: data,
                };
            }
            break;
        case "test":
            {
                message = {
                    type: "test",
                    state: Date.now(),
                };
            }
            break;
        case "mute":
            {
                message = {
                    type: "mute",
                    uid: window.playerid,
                    state: data,
                };
            }
            break;
        default:
            break;
    }
    var jsonStr = JSON.stringify(message);
    // read json string to Buffer
    const buf = Buffer.from(jsonStr);
    return buf;
}