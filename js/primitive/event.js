"use strict";

import { Headset, Controller, Avatar, initAvatar } from "./avatar.js";
import { SyncObject } from "../util/object-sync.js";
import { corelink_message } from "../util/corelink_sender.js";
import { metaroomSender } from "../corelink_handler.js"

export function initSelfAvatar(id) {
  if (!window.avatars) {
    window.avatars = {};
  }

  // create self avatar
  initAvatar(id);
  window.playerid = id;
}

export function init() {
  window.EventBus.subscribe("test", (json) => {
    console.log("receive from server [test]", json["state"], "at", Date.now());
  });

  window.EventBus.subscribe("initialize", (json) => {
    const id = json["id"];
    initSelfAvatar(id);

    // create other avatars joined earlier
    if ("avatars" in json) {
      for (let key in json["avatars"]) {
        const avid = json["avatars"][key]["user"];

        initAvatar(avid);

        window.avatars[avid].headset.matrix =
          json["avatars"][key]["state"]["mtx"];
        window.avatars[avid].headset.position =
          json["avatars"][key]["state"]["pos"];
        window.avatars[avid].headset.orientation =
          json["avatars"][key]["state"]["rot"];

        window.avatars[avid].leftController.matrix =
          json["avatars"][key]["state"]["controllers"]["left"]["mtx"];
        window.avatars[avid].leftController.position =
          json["avatars"][key]["state"]["controllers"]["left"]["pos"];
        window.avatars[avid].leftController.orientation =
          json["avatars"][key]["state"]["controllers"]["left"]["rot"];

        window.avatars[avid].rightController.matrix =
          json["avatars"][key]["state"]["controllers"]["right"]["mtx"];
        window.avatars[avid].rightController.position =
          json["avatars"][key]["state"]["controllers"]["right"]["pos"];
        window.avatars[avid].rightController.orientation =
          json["avatars"][key]["state"]["controllers"]["right"]["rot"];
      }
    }

    console.log("receive event: initialize", {
      id: id,
      avatars: window.avatars,
    });

    // // start webrtc signalling
    // window.webrtc_start();
  });

  window.EventBus.subscribe("join", (json) => {
    console.log("receive event: join");
    // console.log(json);
    const id = json["id"];

    if (!id in window.avatars) {
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
    const payload = json;
    //console.log(payload);
    // for (let key in payload) {
    //TODO: We should not be handling visible avatars like this.
    //TODO: This is just a temporary bandaid.
    if (payload["user"] in window.avatars) {
      window.avatars[payload["user"]].headset.matrix =
        payload["state"]["mtx"];
      window.avatars[payload["user"]].headset.position =
        payload["state"]["pos"];
      window.avatars[payload["user"]].headset.orientation =
        payload["state"]["rot"];
      window.avatars[payload["user"]].leftController.matrix =
        payload["state"]["controllers"]["left"]["mtx"];
      window.avatars[payload["user"]].leftController.position =
        payload["state"]["controllers"]["left"]["pos"];
      window.avatars[payload["user"]].leftController.orientation =
        payload["state"]["controllers"]["left"]["rot"];
      window.avatars[payload["user"]].rightController.matrix =
        payload["state"]["controllers"]["right"]["mtx"];
      window.avatars[payload["user"]].rightController.position =
        payload["state"]["controllers"]["right"]["pos"];
      window.avatars[payload["user"]].rightController.orientation =
        payload["state"]["controllers"]["right"]["rot"];
      window.avatars[payload["user"]].headset.model.visible = true;
      window.avatars[
        payload["user"]
      ].leftController.model.visible = true;
      window.avatars[
        payload["user"]
      ].rightController.model.visible = true;
      // window.avatars[payload["user"]].mode = payload["state"]["mode"];
    } else {
      // never seen, create
      console.log("previously unseen user avatar", payload["user"]);
      if (
        window.avatars[payload["user"]] &&
        "leave" in window.avatars[payload["user"]]
      ) {
        console.log("left already");
      } else {
        initAvatar(payload["user"]);
      }
    }
    // }
  });

  window.EventBus.subscribe("mute", (json) => {
    // a client wants to mute self
    console.log("receive webrtc", json["ts"], Date.now());
    window.mute(json["state"]["uuid"]);
  });

  window.EventBus.subscribe("webrtc", (json) => {
    var signal = json["state"];
    console.log("receive webrtc", json, signal, json["ts"], Date.now());
    // if (!signal.roomID)
    //     return;

    var peerUuid = signal.uuid;

    // Ignore messages that are not for us or from ourselves
    if (
      peerUuid == window.localUuid ||
      (signal.dest != window.localUuid && signal.dest != "all")
      // && signal.roomID != window.avatars[window.playerid].roomID
    )
      return;

    if (
      signal.displayName != undefined &&
      signal.dest == "all"
      // && signal.roomID == window.avatars[window.playerid].roomID
    ) {
      // set up peer connection object for a newcomer peer
      console.log(
        "[webrtc] case 1: set up peer connection object for a newcomer peer:" + peerUuid
      );
      window.setUpPeer(peerUuid, signal.displayName);
      // window.serverConnection.send(JSON.stringify({ 'displayName': window.localDisplayName, 'uuid': window.localUuid, 'dest': peerUuid }));
      // window.wsclient.send("webrtc", {
      //   uuid: window.localUuid,
      //   // roomID: window.avatars[window.playerid].roomID,
      //   displayName: window.playerid,
      //   dest: peerUuid,
      // });
      // corelink
      var msg = corelink_message("webrtc", {
        uuid: window.localUuid,
        // roomID: window.avatars[window.playerid].roomID,
        displayName: window.playerid,
        dest: peerUuid,
      });
      corelink.send(metaroomSender, msg);
      msg = corelink_message("webrtc", {
        test: "hello"
      });
      corelink.send(metaroomSender, msg);
      console.log("[webrtc] corelink.send from", window.localUuid, "to", peerUuid, msg);
      // JSON.stringify({ 'MR_Message': "Broadcast_All", 'displayName': MRVoip.username, 'uuid': MRVoip.localUuid, 'dest': peerUuid, 'roomID': MRVoip.roomID }));
    } else if (
      signal.displayName != undefined &&
      signal.dest == window.localUuid
      // && signal.roomID == window.avatars[window.playerid].roomID
    ) {
      // initiate call if we are the newcomer peer
      console.log(
        "[webrtc] case 2: initiate call if we are the newcomer peer:" + peerUuid
      );
      window.setUpPeer(peerUuid, signal.displayName, true);
    } else if (signal.sdp) {
      console.log("[webrtc] case 3: sdp");
      window.peerConnections[peerUuid].pc
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(function () {
          // Only create answers in response to offers
          if (signal.sdp.type == "offer") {
            window.peerConnections[peerUuid].pc
              .createAnswer()
              .then((description) => createdDescription(description, peerUuid))
              .catch(errorHandler);
          }
        })
        .catch(errorHandler);
    } else if (signal.ice) {
      console.log("[webrtc] case 4: ice");
      window.peerConnections[peerUuid].pc
        .addIceCandidate(new RTCIceCandidate(signal.ice))
        .catch(errorHandler);
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

  // ZH: object
  window.EventBus.subscribe("object", (json) => {
    if (!window.objects) {
      window.objects = {};
    }

    // const success = json["success"];
    // if (success) {
    // console.log("object update: ", json);
    // update metadata for next frame's rendering

    // let dirtyObjects = json["data"];
    // Object.keys(dirtyObjects).forEach(function (key) {
    //   // console.log("object update: ", key, dirtyObjects[key]);
    //   if (!(key in window.objects))
    //     window.objects[key] = new SyncObject(
    //       key,
    //       dirtyObjects[key]["state"]["type"]
    //     );
    //   window.objects[key].matrix = dirtyObjects[key]["state"]["matrix"];
    // });

    let dirtyObject = json["state"];
    // { type: objectType, matrix: objectMatrix, objid: objid }
    if (!(dirtyObject["objid"] in window.objects))
      window.objects[dirtyObject["objid"]] = new SyncObject(
        dirtyObject["objid"],
        dirtyObject["type"]
      );
    window.objects[dirtyObject["objid"]].matrix = dirtyObject["matrix"];


    // }
    // else {
    //     console.log("failed object message", json);
    // }
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
