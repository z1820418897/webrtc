var content = document.getElementById('content');

/**
 * 定义roomId
 * */


var roomId = prompt("请输入房间号", "123456");
var selfId = 0;
var peers=[];

/**
 * 定义WebSocket
 * */
var ws = null;



/**
 * 定义webrtc
 * */
var RTCPeerConnection;
var RTCSessionDescription;
var configuration;

init();

function init() {

    RTCPeerConnection = window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.msRTCPeerConnection;

    RTCSessionDescription = window.RTCSessionDescription ||
        window.mozRTCSessionDescription ||
        window.webkitRTCSessionDescription ||
        window.msRTCSessionDescription;

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.msGetUserMedia;

    let userAgent = navigator.userAgent;
    if (userAgent.indexOf("Safari") > -1) {
        let OrigPeerConnection = RTCPeerConnection;
        RTCPeerConnection = function (pcConfig, pcConstraints) {
            if (pcConfig && pcConfig.iceServers) {
                let newIceServers = [];
                for (let i = 0; i < pcConfig.iceServers.length; i++) {
                    let server = pcConfig.iceServers[i];
                    if (!server.hasOwnProperty('urls') &&
                        server.hasOwnProperty('url')) {
                        // utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
                        server = JSON.parse(JSON.stringify(server));
                        server.urls = server.url;
                        delete server.url;
                        newIceServers.push(server);
                    } else {
                        newIceServers.push(pcConfig.iceServers[i]);
                    }
                }
                pcConfig.iceServers = newIceServers;
            }
            return new OrigPeerConnection(pcConfig, pcConstraints);
        };
    }

    configuration = {
        "iceServers": [{
            // "url": "stun:stun.l.google.com:19302"
            "url": "stun:116.62.60.244:3478"
        },
            // {
            //     "url": "stun:global.stun.twilio.com:3478"
            // },
            // {
            //     "url": "turn:global.stun.twilio.com:3478",
            //     "username": "79fdd6b3c57147c5cc44944344c69d85624b63ec30624b8674ddc67b145e3f3c",
            //     "credential": "xjfTOLkVmDtvFDrDKvpacXU7YofAwPg6P6TXKiztVGw"
            // }
            {
                "url": "turn:116.62.60.244:3478",
                "username": "gcsoft",
                "credential": "gcsoft"
            }
        ]
    };

    connectionWs();
}


/**
 * ws连接函数
 * */
function connectionWs() {
    ws = new WebSocket('wss://10.10.100.142:443');
    // ws = new WebSocket('ws://10.10.100.142:3000');
    ws.onopen = onConnetction;
    ws.onclose = onClose;
    ws.onmessage = onMessage;
    ws.onerror = onError;
}

function onConnetction(event) {
    console.log('websocket连接成功');
}

function onMessage(message) {
    console.log("websocket接收到消息:" + message.data);
    let msg;

    try {
        msg = JSON.parse(message.data);
    } catch (e) {
        console.log(e.message);
    }

    switch (msg.type) {
        case 'conn': {

            selfId = msg.id;

            let m = {
                type: 'join',
                id: selfId,
                roomId: roomId,
            };
            ws.send(JSON.stringify(m));

            break;
        }
        case 'join': {
            alert('新客户端接入-' + msg.ids);

            peers = msg.ids;
            addSelfVideoStream();

            break;
        }
        case 'offer': {
            let from = msg.from;

            getLocalStream().then((stream) => {
                var pc = createPeerConnection(from, false, stream);
                pc.setRemoteDescription(new RTCSessionDescription(msg.description), () => {
                    if (pc.remoteDescription.type == "offer") {
                        createAnswer(pc, msg.from);
                    }
                });

            });


            break;
        }
        case 'answer': {
            let id = msg.from;
            let pc = null;

            if (id in peer_connections) {
                pc = peer_connections[id];
            }

            if (pc && msg.description) {
                pc.setRemoteDescription(new RTCSessionDescription(msg.description), () => {
                }, this.logError);
            }

            break;
        }
        case 'candidate': {
            console.log('candidate'+msg.from);
            let from = msg.from;
            let pc = null;
            if (from in peer_connections) {
                pc = peer_connections[from];
            }
            if (pc && msg.candidate) {
                pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
            break;
        }
        case 'leave' : {
            let id = msg.id;

            let pc=peer_connections[id];
            if(pc!=null){
                pc.close();
                delete peer_connections[id];
            }


            console.log(id+"退出房间");
            var video = document.getElementById(id);
            console.log(video);

            content.removeChild(video);

            break;

        }
        default:
            break;

    }

}
logError = (error) => {
    console.log("logError", error);
}

function onClose(event) {
    console.log('websocket断开连接'+event);
}


function onError(error) {
    console.log('连接错误' + error);
}

/**
 * 设置远端视频
 * */

function  addRemoteVideo(stream,id){
    var remote_video = document.createElement('video');
    var remote_video_style = remote_video.style;
    remote_video_style.width='200px';
    remote_video_style.height='200px';
    remote_video.id=id;
    content.appendChild(remote_video);

    var video = document.getElementById(id);
    video.srcObject = stream;
    video.onloadedmetadata = function (e) {
        video.play();
    };
}


/**
 * 设置本地音视频
 * */
var constraints = { audio: true, video: { width: 1280, height: 1080 } };
var content = document.getElementById('content');
function addSelfVideoStream() {
    try {
        var self_video = document.createElement('video');
        var self_video_style = self_video.style;
        self_video_style.width='200px';
        self_video_style.height='200px';
        self_video.id='localVideo';
        content.appendChild(self_video);

        // navigator.mediaDevices.getUserMedia(constraints)
        //     .then(function(mediaStream) {
        //
        //         var video = document.getElementById('localVideo');
        //         video.srcObject = mediaStream;
        //         video.onloadedmetadata = function(e) {
        //             video.play();
        //         };
        //
        //         //创建ice连接
        //         for(let i=0;i<peers.length;i++){
        //
        //             if(peers[i]==selfId) continue;
        //             createPeerConnection(peers[i],true,mediaStream);
        //
        //         }
        //
        //     })
        //     .catch(function(err) { console.log(err.name + ": " + err.message); });

        getLocalStream().then((stream)=>{

            var video = document.getElementById('localVideo');
            video.srcObject = stream;
            video.onloadedmetadata = function (e) {
                video.play();
            };

            for(let i=0;i<peers.length;i++){
                if(peers[i]==selfId) continue;
                createPeerConnection(peers[i],true,stream);
            };
        });


    } catch (e) {
        console.log(e);
    }
}


getLocalStream = () => {
    return new Promise((pResolve, pReject)=>{
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                pResolve(mediaStream);
            }).catch((err)=>{
                console.log(err);
                pReject(err);
        });
    });
};


var peer_connections = {};
createPeerConnection = (id,isoffer,localstream) => {
    console.log('创建peer连接'+id);

    var pc = new RTCPeerConnection(configuration);
    peer_connections["" + id] = pc;

    pc.onicecandidate = (event) => {
        console.log('onicecandidate', event);
        if (event.candidate) {
            let msg = {
                type: 'candidate',
                to: id,
                candidate: event.candidate,
            };
            ws.send(JSON.stringify(msg));
        }
    };

    pc.onnegotiationneeded = () => {
        console.log('onnegotiationneeded');
    };
    pc.onsignalingstatechange = (event) => {
        console.log('onsignalingstatechange', event);
    };

    pc.onaddstream = (event) => {
        console.log('onaddstream', event);
        addRemoteVideo(event.stream,id);
    };
    pc.onremovestream = (event) => {
        console.log('onremovestream', event);

    };

    pc.addStream(localstream);

    if(isoffer)
        createOffer(pc,id);

    console.log('创建peer连接完成');
    return pc;
};

function error(err) { console.log(err); }

createOffer = (pc,id) => {
    pc.createOffer(function(offer) {
        pc.setLocalDescription(new RTCSessionDescription(offer), function() {
            console.log('setLocalDescription', pc.localDescription);
            let m = {
                type: 'offer',
                to: id,
                description: pc.localDescription,
            };
            console.log('发送offset到'+id);
            ws.send(JSON.stringify(m));
        }, error);
    }, error);
};


createAnswer = (pc,id) => {
    pc.createAnswer(function(desc){
        pc.setLocalDescription(new RTCSessionDescription(desc), () => {
            console.log('setLocalDescription', pc.localDescription);
            let msg = {
                type: 'answer',
                to: id,
                description: pc.localDescription,
            };
            ws.send(JSON.stringify(msg));
        },logError);
    },logError);

};