"use strict";

import { initXR } from "../js/immersive-pre.js"
import { ab2str, corelink_message } from "../js/util/corelink_sender.js"
import { initSelfAvatar } from "../js/primitive/event.js"
import { initAvatar } from "../js/primitive/avatar.js"

const workspace = 'Chalktalk'
const protocol = 'ws'
const datatype = ['sync', 'webrtc', 'event', 'init'];
var receiverdata = 0.0
export var metaroomSyncSender = ""
export var metaroomWebrtcSender = "";
export var metaroomEventSender = "";
export var metaroomInitSender = "";
export var metaroomReceiver = "";

var assembled_packets = {}
var last_assembled_frame = 0;

window.offlineMode = false;
function checkInternet() {
    var ifConnected = window.navigator.onLine;
    if (ifConnected) {
        console.log('Connection available');
    } else {
        window.offlineMode = true;
        console.log('Connection not available');
    }
}

const run = async () => {
    checkInternet();

    if (window.offlineMode) {
        // Start the XR application.
        initSelfAvatar(0);
        initXR();
        return;
    }

    var config = {}
    config.username = 'Testuser'
    config.password = 'Testpassword'
    // config.host = 'corelink.hpc.nyu.edu'
    config.host = 'localhost'
    config.port = 20012
    corelink.debug = false;


    if (await corelink.connect({ username: config.username, password: config.password }, { ControlIP: config.host, ControlPort: config.port }).catch((err) => {
        console.log(err);
    })) {
        //const btn = document.createElement('button')
        //btn.innerHTML = "Hey there we have a new stream"
        //console.log("butttttonnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",btn)
        //btn.setAttribute('onclick', 'alert("hello")')

        corelink.on('receiver', (e) => console.log('receiver callback', e))
        corelink.on('sender', (e) => console.log('sender callback', e))

        corelink.on('stale', (streamID) => {
            console.log("Stream has been dropped", streamID)
            var iDiv = document.getElementById(streamID.streamID)
            var btnid = "stream" + streamID.streamID
            console.log(btnid)
            var btn = document.getElementById(btnid)
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", streamID.streamID)
            if (iDiv) {
                iDiv.remove()
                btn.remove()
            }
        })

        corelink.on('dropped', (streamID) => {
            console.log("Steam has been dropped", streamID)
            var iDiv = document.getElementById(streamID.streamID);
            var btnid = "stream" + streamID.streamID
            console.log(btnid)
            // var btn = document.getElementById(btnid)
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$", streamID)
            if (iDiv) {
                iDiv.remove()
                btn.remove()
            }
        })

        if (metaroomSyncSender = await corelink.createSender({
            workspace, protocol, type: 'sync', echo: true, alert: true,
        }).catch((err) => { console.log(err) })) {
            console.log("ZH: metaroomSyncSender", metaroomSyncSender);
            // initialize
            initSelfAvatar(metaroomSyncSender);
        }

        if (metaroomWebrtcSender = await corelink.createSender({
            workspace, protocol, type: 'webrtc', echo: true, alert: true,
        }).catch((err) => { console.log(err) })) {
            console.log("ZH: metaroomWebrtcSender", metaroomWebrtcSender);
            // start webrtc signalling
            // window.webrtc_start();
        }

        if (metaroomEventSender = await corelink.createSender({
            workspace, protocol, type: 'event', echo: false, alert: true,
        }).catch((err) => { console.log(err) })) {
            console.log("ZH: metaroomEventSender", metaroomEventSender);
        }

        if (metaroomInitSender = await corelink.createSender({
            workspace, protocol, type: 'init', echo: false, alert: true,
        }).catch((err) => { console.log(err) })) {
            // window.bInit = false;
            console.log("ZH: metaroomInitSender", metaroomInitSender);
            if (metaroomReceiver != "") {
                var msg = corelink_message("init", {
                    displayName: window.playerid,
                    uuid: window.localUuid,
                    dest: "all",
                });
                corelink.send(metaroomInitSender, msg);
                // setTimeout(10000, corelink.send(metaroomInitSender, msg));
                console.log("corelink.send", msg);
            }
        }

        if (metaroomReceiver = await corelink.createReceiver({
            workspace, protocol, type: datatype, echo: true, alert: true,
        }).catch((err) => { console.log(err) })) {
            if (metaroomInitSender != "") {
                var msg = corelink_message("init", {
                    displayName: window.playerid,
                    uuid: window.localUuid,
                    dest: "all",
                });
                corelink.send(metaroomInitSender, msg);
                // setTimeout(10000, corelink.send(metaroomInitSender, msg));
                console.log("corelink.send", msg);
            }
        }

        metaroomReceiver.forEach(async data => {
            // console.log("[webrtc debug] metaroomReceiver.forEach", data.streamID, data.meta.name)
            // var btn = document.createElement("BUTTON")   // Create a <button> element
            // btn.innerHTML = " Plot: " + data.streamID + " " + data.meta.name
            // btn.id = "stream" + data.streamID
            // var iDiv = document.createElement('div')
            // iDiv.id = data.streamID
            // btn.onclick = () => plotmydata(iDiv.id)
            // document.body.appendChild(btn)
            // document.body.appendChild(iDiv)
        })

        corelink.on('receiver', async (data) => {
            console.log("[webrtc debug] corelink.on('receiver', async (data)", data.streamID, data.meta.name)
            await corelink.subscribe({ streamIDs: [data.streamID] })
            if (!(data.streamID in window.avatars)) {
                initAvatar(data.streamID);
            }
        })

        corelink.on('data', async (streamID, data, header) => {
            if (header && header["packet"] && header["frame"]) {
                let packet_info = header["packet"];
                let frame = parseInt(header["frame"]);
                if (frame > last_assembled_frame) {
                    let breakpos = packet_info.indexOf("/");
                    if (breakpos > -1) {
                        let packnum = parseInt(packet_info.substring(0, breakpos));
                        let packtotal = parseInt(packet_info.substring(breakpos + 1));
                        if (packnum != NaN && packtotal != NaN) {
                            if (!assembled_packets[streamID]) {
                                assembled_packets[streamID] = {};
                            }
                            if (!assembled_packets[streamID][frame]) {
                                assembled_packets[streamID][frame] = new Array(packtotal);
                            }
                            assembled_packets[streamID][frame][packnum - 1] = data;
                            let packet_ready = true;
                            for (let i = 0; i < packtotal; i++) {
                                if (!assembled_packets[streamID][frame][i]) {
                                    packet_ready = false;
                                }
                            }
                            if (packet_ready) {
                                let complete_packet = "";
                                for (let i = 0; i < packtotal; i++) {
                                    complete_packet += String.fromCharCode.apply(null, new Uint8Array(assembled_packets[streamID][frame][i]));
                                }
                                // console.log("receive frame " + frame);
                                receiverdata = JSON.parse(complete_packet);
                                window[streamID + '_data'] = receiverdata;
                                window.EventBus.publish(receiverdata["type"], receiverdata);
                                delete assembled_packets[streamID][frame];
                                last_assembled_frame = frame;
                            }
                        } 
                    }
                } else {
                    if (assembled_packets[streamID] && assembled_packets[streamID][frame]) {
                        delete assembled_packets[streamID][frame];
                    }
                }
            } else {
                receiverdata = ab2str(data);
                window[streamID + '_data'] = receiverdata;
                window.EventBus.publish(receiverdata["type"], receiverdata);
            }
            // if (receiverdata["type"] != "avatar" && receiverdata["type"] != "realsense")
            //     console.log("corelink.on('data', (streamID, data, header)", streamID, window[streamID + '_data']["type"], window[streamID + '_data'])

        }).catch((err) => { console.log(err) })

        // Start the XR application.
        window.initxr = true;
        initXR();
    }
}

function rand() {
    return Math.random();
}

run();