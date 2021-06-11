"use strict";

export function ab2str(buf) {
    var rawBuf = String.fromCharCode.apply(null, new Uint8Array(buf));
    // we are using json objects everywhere
    var jsonObj = JSON.parse(rawBuf);
    return jsonObj;
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 1); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export function corelink_message(type, data) {
    let message;
    switch (type) {
        case "initialize":
            message = {
                type: "initialize",
                ts: Date.now(),
                id: data
            };
            break;
        case "avatar":
            message = {
                type: "avatar",
                user: data,
                ts: Date.now(),
                state: window.avatars[data].toJson(),
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
            console.log("send webrtc", message);
            break;
        case "object":
            {
                // ZH: object update
                message = {
                    type: "object",
                    ts: Date.now(),
                    uid: window.playerid,
                    state: data,
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
        case "demo":
            message = {
                type: "demo",
                uid: window.playerid,
                state: data,
            };
            console.log("demo", message);
            break;
        default:
            break;
    }
    var json_bytes = str2ab(JSON.stringify(message));
    // var jsonStr = JSON.stringify(message);
    // read json string to Buffer
    // const buf = Buffer.from(jsonStr);
    return json_bytes;
}