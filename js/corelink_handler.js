const workspace = 'Holodeck'
const protocol = 'ws'
const datatype = ['metaroom']
var receiverdata = 0.0

function ab2str(buf) {
    var rawData = String.fromCharCode.apply(null, new Uint8Array(buf))
    return parseFloat(rawData)
}

const run = async () => {

    config = {}
    config.username = 'Testuser'
    config.password = 'Testpassword'
    config.host = 'corelink.hpc.nyu.edu'
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

        streams = await corelink.createReceiver({
            workspace, protocol, type: datatype, echo: true, alert: true,
        }).catch((err) => { console.log(err) })

        streams.forEach(async data => {
            console.log("streams.forEach", data.streamID, data.meta.name)
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
            console.log("corelink.on('receiver', async (data)", data.streamID, data.meta.name)
            // var btn = document.createElement("BUTTON")  // Create a <button> element
            // btn.innerHTML = " Plot: " + data.streamID + " " + data.meta.name;
            // btn.id = "stream" + data.streamID
            // var iDiv = document.createElement('div')
            // iDiv.id = data.streamID;
            // btn.onclick = () => plotmydata(iDiv.id)
            // document.body.appendChild(btn)
            // document.body.appendChild(iDiv)

            await corelink.subscribe({ streamIDs: [data.streamID] })
        })

        corelink.on('data', (streamID, data, header) => {

            receiverdata = ab2str(data)
            window[streamID + '_data'] = ab2str(data)
            console.log(streamID, window[streamID + '_data'])

        }).catch((err) => { console.log(err) })
    }
}

function rand() {
    return Math.random();
}

run();