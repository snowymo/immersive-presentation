import { initXR } from "../js/immersive-pre.js"
import { ab2str, corelink_message } from "../js/util/corelink_sender.js"
import { initSelfAvatar } from "../js/primitive/event.js"
import { initAvatar } from "../js/primitive/avatar.js"

const workspace = 'Chalktalk'
const protocol = 'ws'
const datatype = ['metaroom']
var receiverdata = 0.0
export var metaroomSender = "";
export var metaroomReceiver = "";

const run = async () => {

    var config = {}
    config.username = 'Testuser'
    config.password = 'Testpassword'
    config.host = 'corelink.hpc.nyu.edu'
    // config.host = 'localhost'
    config.port = 20012


    if (await corelink.connect({ username: config.username, password: config.password }, { ControlIP: config.host, ControlPort: config.port }).catch((err) => { console.log(err) })) {
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

        if (metaroomSender = await corelink.createSender({
            workspace, protocol, type: 'metaroom', echo: true, alert: true,
        }).catch((err) => { console.log(err) })) {
            console.log("ZH: metaroomSender", metaroomSender);
            // initialize
            initSelfAvatar(metaroomSender);
            // start webrtc signalling
            window.webrtc_start();
        }

        metaroomReceiver = await corelink.createReceiver({
            workspace, protocol, type: datatype, echo: true, alert: true,
        }).catch((err) => { console.log(err) })

        metaroomReceiver.forEach(async data => {
            console.log("[webrtc debug] metaroomReceiver.forEach", data.streamID, data.meta.name)
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

        corelink.on('data', (streamID, data, header) => {

            receiverdata = ab2str(data)
            window[streamID + '_data'] = ab2str(data)
            window.EventBus.publish(receiverdata["type"], receiverdata);
            if (receiverdata["type"] != "avatar")
                console.log("corelink.on('data', (streamID, data, header)", streamID, window[streamID + '_data'])

        }).catch((err) => { console.log(err) })

        // Start the XR application.
        initXR();
    }
}

function rand() {
    return Math.random();
}

run();