'use strict';

import { Headset, Controller, Avatar, initAvatar } from "./avatar.js"
// import {setUpPeer} from '../util/voip-webrtc.js'

export function init() {
    window.EventBus.subscribe("test", (json) => {
        console.log("receive from server [test]", json["state"], "at", Date.now());
    });

    window.EventBus.subscribe("initialize", (json) => {
        if (!window.avatars) {
            window.avatars = {};
        }

        const id = json["id"];

        // let headset = new Gltf2Node({url: '../../media/gltf/headset/headset.gltf'});
        let headset = new Headset();
        let leftController = new Controller("left");
        let rightController = new Controller("right");
        let playerAvatar = new Avatar(headset, id, leftController, rightController);

        for (let key in json["avatars"]) {
            const avid = json["avatars"][key]["user"];

            let headset = new Headset();
            let leftController = new Controller("left");
            let rightController = new Controller("right");
            // setup render nodes for new avatar
            headset.model.name = "headset" + avid;
            headset.matrix = json["avatars"][key]["state"]["mtx"];
            headset.position = json["avatars"][key]["state"]["pos"];
            headset.orientation = json["avatars"][key]["state"]["rot"];
            window.scene.addNode(headset.model);

            leftController.model.name = "LC" + avid;
            leftController.matrix = json["avatars"][key]["state"]["controllers"]["left"]["mtx"];
            leftController.position = json["avatars"][key]["state"]["controllers"]["left"]["pos"];
            leftController.orientation = json["avatars"][key]["state"]["controllers"]["left"]["rot"];
            window.scene.addNode(leftController.model);

            rightController.model.name = "RC" + avid;
            rightController.matrix = json["avatars"][key]["state"]["controllers"]["right"]["mtx"];
            rightController.position = json["avatars"][key]["state"]["controllers"]["right"]["pos"];
            rightController.orientation = json["avatars"][key]["state"]["controllers"]["right"]["rot"];
            window.scene.addNode(rightController.model);

            let avatar = new Avatar(headset, avid, leftController, rightController);
            window.avatars[avid] = avatar;
        }

        window.avatars[id] = playerAvatar;
        window.playerid = id;
        console.log("receive event: initialize", {
            id: id,
            avatars: window.avatars
        });
        // window.microphoneInit();
        window.webrtc_start();
    });

    window.EventBus.subscribe("join", (json) => {
        console.log("receive event: join");
        // console.log(json);
        const id = json["id"];

        if (id in window.avatars) {

        } else {
            initAvatar(id);
        }
        console.log("join window.avatars", window.avatars);

        // window.updatePlayersMenu();
    });

    window.EventBus.subscribe("leave", (json) => {
        console.log(json);
        if (window.avatars[json["user"]]) {
            window.avatars[json["user"]].headset.model.visible = false;
            window.avatars[json["user"]].leftController.model.visible = false;
            window.avatars[json["user"]].rightController.model.visible = false;
            window.avatars[json["user"]].leave = true;
            // delete window.avatars[json["user"]];
            // TODO clean up when too many
        }

        // window.updatePlayersMenu();
    });

    // window.EventBus.subscribe("tick", (json) => {
    //     // console.log("world tick: ", json);
    // });

    window.EventBus.subscribe("avatar", (json) => {
        //if (MR.VRIsActive()) {
        // console.log("subscribe avatar")
        // console.log(json);
        const payload = json["data"];
        //console.log(payload);
        for (let key in payload) {
            //TODO: We should not be handling visible avatars like this.
            //TODO: This is just a temporary bandaid.
            if (payload[key]["user"] in window.avatars) {
                window.avatars[payload[key]["user"]].headset.matrix = payload[key]["state"]["mtx"];
                window.avatars[payload[key]["user"]].headset.position = payload[key]["state"]["pos"];
                window.avatars[payload[key]["user"]].headset.orientation = payload[key]["state"]["rot"];
                //console.log(payload[key]["state"]);
                window.avatars[payload[key]["user"]].leftController.matrix = payload[key]["state"]["controllers"]["left"]["mtx"];
                window.avatars[payload[key]["user"]].leftController.position = payload[key]["state"]["controllers"]["left"]["pos"];
                window.avatars[payload[key]["user"]].leftController.orientation = payload[key]["state"]["controllers"]["left"]["rot"];
                window.avatars[payload[key]["user"]].rightController.matrix = payload[key]["state"]["controllers"]["right"]["mtx"];
                window.avatars[payload[key]["user"]].rightController.position = payload[key]["state"]["controllers"]["right"]["pos"];
                window.avatars[payload[key]["user"]].rightController.orientation = payload[key]["state"]["controllers"]["right"]["rot"];
                window.avatars[payload[key]["user"]].headset.model.visible = true;
                window.avatars[payload[key]["user"]].leftController.model.visible = true;
                window.avatars[payload[key]["user"]].rightController.model.visible = true;
                // window.avatars[payload[key]["user"]].mode = payload[key]["state"]["mode"];
            } else {
                // never seen, create
                //ALEX: AVATARS WHO ARE ALSO IN BROWSER MODE GO HERE...
                console.log("previously unseen user avatar", payload[key]["user"]);
                if("leave" in  window.avatars[payload[key]["user"]]){
                    console.log("left already");
                }else{
                    initAvatar(payload[key]["user"]);
                }                
                // let avatarCube = createCubeVertices();
                // MR.avatars[payload[key]["user"]] = new Avatar(avatarCube, payload[key]["user"]);
            }
        }
        //}
    });

    window.EventBus.subscribe("webrtc", (json) => {
        var signal = json["state"];
        console.log("receive webrtc", json["ts"], Date.now());
        // if (!signal.roomID)
        //     return;

        var peerUuid = signal.uuid;

        // Ignore messages that are not for us or from ourselves
        if (peerUuid == window.localUuid ||
            (signal.dest != window.localUuid && signal.dest != 'all'
                // && signal.roomID != window.avatars[window.playerid].roomID
            )) return;

        if (signal.displayName != undefined && signal.dest == 'all'
            // && signal.roomID == window.avatars[window.playerid].roomID
        ) {
            // set up peer connection object for a newcomer peer
            console.log("case 1: set up peer connection object for a newcomer peer:" + peerUuid);
            window.setUpPeer(peerUuid, signal.displayName);
            // window.serverConnection.send(JSON.stringify({ 'displayName': window.localDisplayName, 'uuid': window.localUuid, 'dest': peerUuid }));
            window.wsclient.send("webrtc",
                {
                    uuid: window.localUuid,
                    // roomID: window.avatars[window.playerid].roomID,
                    displayName: window.playerid,
                    dest: peerUuid
                });
            // JSON.stringify({ 'MR_Message': "Broadcast_All", 'displayName': MRVoip.username, 'uuid': MRVoip.localUuid, 'dest': peerUuid, 'roomID': MRVoip.roomID }));

        } else if (signal.displayName != undefined && signal.dest == window.localUuid
            // && signal.roomID == window.avatars[window.playerid].roomID
        ) {
            // initiate call if we are the newcomer peer
            console.log("case 2: initiate call if we are the newcomer peer:" + peerUuid);
            window.setUpPeer(peerUuid, signal.displayName, true);

        } else if (signal.sdp) {
            console.log("case 3: sdp");
            window.peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
                // Only create answers in response to offers
                if (signal.sdp.type == 'offer') {
                    window.peerConnections[peerUuid].pc.createAnswer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
                }
            }).catch(errorHandler);

            // if ("nego" in window.peerConnections[peerUuid]) {
            //     console.log("already setRemoteDescription in window.peerConnections[" + peerUuid + "]");
            // } else {
            //     console.log("setremotedescription");
            //     window.peerConnections[peerUuid].nego = true;
            //     window.peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            //         // Only create answers in response to offers
            //         if (signal.sdp.type == 'offer') {
            //             window.peerConnections[peerUuid].pc.createAnswer().then(description => window.createdDescription(description, peerUuid)).catch(window.errorHandler);
            //         }
            //     }).catch(window.errorHandler);
            //     if("icecall" in window.peerConnections[peerUuid]){
            //         console.log("addIceCandidate");
            //         window.peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(window.errorHandler);
            //     }
            // }
        } else if (signal.ice) {
            console.log("case 4: ice");
            window.peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
            // window.peerConnections[peerUuid].icecall = true;
            // if ("nego" in window.peerConnections[peerUuid]) {
            //     // console.log("addIceCandidate");
            //     window.peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(window.errorHandler);
            // }
        }
    });


    /*
    // expected format of message
    const response = {
        "type": "lock",
        "uid": key,
        "success": boolean
    };

     */

    // TODO:
    // deal with logic and onlock
    // window.EventBus.subscribe("lock", (json) => {

    //     const success = json["success"];
    //     const key = json["uid"];

    //     if (success) {
    //         console.log("acquire lock success: ", key);
    //         window.objs[key].lock.locked = true;
    //     } else {
    //         console.log("acquire lock failed : ", key);
    //     }

    // });

    /*
    // expected format of message
    const response = {
            "type": "release",
            "uid": key,
            "success": boolean
    };

     */

    // TODO:
    // deal with logic and onlock
    // window.EventBus.subscribe("release", (json) => {

    //     const success = json["success"];
    //     const key = json["uid"];

    //     if (success) {
    //         console.log("release lock success: ", key);
    //     } else {
    //         console.log("release lock failed : ", key);
    //     }

    // });

    /*
    //on success:

    const response = {
        "type": "object",
        "uid": key,
        "state": json,
        "lockid": lockid,
        "success": true
    };

    //on failure:

    const response = {
        "type": "object",
        "uid": key,
        "success": false
    };
    */

    // TODO:
    // update to MR.objs
    /*
    MR.EventBus.subscribe("object", (json) => {

        const success = json["success"];

        if (success) {
            console.log("object moved: ", json);
            // update MR.objs
        } else {
            console.log("failed object message", json);
        }

    });*/

    // TODO:
    // add to MR.objs
    // window.EventBus.subscribe("spawn", (json) => {

    //     const success = json["success"];

    //     if (success) {
    //         console.log("object created ", json);
    //         // add to MR.objs
    //     } else {
    //         console.log("failed spawn message", json);
    //     }

    // });

    window.EventBus.subscribe("object", (json) => {
        const success = json["success"];
        if (success) {
            console.log("object moved: ", json);
            // update update metadata for next frame's rendering
            let current = window.objs[json["uid"]];
            console.log(json);
            current.position = [json["state"]["position"][0], json["state"]["position"][1], json["state"]["position"][2]];
            //current.orientation = MR.objs[json["state"]["orientation"]];
        }
        else {
            console.log("failed object message", json);
        }
    });

    // on success
    // const response = {
    //   "type": "calibrate",
    //   "x": ret.x,
    //   "z": ret.z,
    //   "theta": ret.theta,
    //   "success": true
    // };

    // on failure:
    //   const response = {
    //     "type": "calibrate",
    //     "success": false
    // };

    // window.EventBus.subscribe("calibration", (json) => {
    //     console.log("world tick: ", json);
    // });
}
