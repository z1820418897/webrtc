
///将conn的代码整理完后
//测试执行js
new client().getLocalStream();

/*******************************************------------客户端js ------------**************************************************/
const client = function () {

    /*******************************************************************************************************************************
     * 获取界面元素
     * *****************************************************************************************************************************/
    var content = document.getElementById('content');


    /*******************************************************************************************************************************
     * 定义全局变量
     * *****************************************************************************************************************************/
    var selfId = 0;//自身id
    var peers=[];//同房间的所有id

    var roomId='';//房间Id

    var ws= null;//websocket

    var RTCPeerConnection;//rtc连接
    var RTCSessionDescription;//session描述
    var configuration; //webrtc获取配置





    /*******************************************************************************************************************************
     * 连接WebSocket
     * *****************************************************************************************************************************/





    /*******************************************************************************************************************************
     * 连接ICE
     * *****************************************************************************************************************************/
    var pc = new RTCPeerConnection();
    pc.onaddstream = function (obj) {
        var vid = document.createElement("video");
        content.appendChild(vid);
        vid.srcObject = obj.stream;
        vid.onloadedmetadata = function (e) {
            vid.play();
        };
    };

    function getLocalStream() {
        navigator.mediaDevices.getUserMedia({video: true})
            .then(function (mediaStream) {
                pc.onaddstream({stream: mediaStream});
                pc.addStream(mediaStream);
                pc.createOffer(function (offer) {
                    pc.setLocalDescription(new RTCSessionDescription(offer), function () {
                        console.log('你好世界');
                    }, error);
                }, error);
            })
            .catch(function (err) {
                console.log(err.name + ": " + err.message);
            });
    }

    function endCall() {
        var videos = document.getElementsByTagName("video");
        for (var i = 0; i < videos.length; i++) {
            videos[i].pause();
        }
        pc.close();
    }

    function error(err) {
        endCall();
    }


}