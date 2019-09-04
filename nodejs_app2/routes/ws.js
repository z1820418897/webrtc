var express = require('express');
var clients = new Map();
var rooms = new Map();

/**
 * 客户端连接成功后 发送id给客户端 命令为conn
 * */
function sendConn(client_self) {
    let message = {
        type: 'conn',
        id: client_self.id,
};
    _send(client_self, JSON.stringify(message));
}

/**
 * 有客户端加入房间后 发送房间里所有客户端id返回 命令为join
 * */
function sendJoin(client_self) {
    // let cls = rooms.values().next().value;
    let cls=rooms.get(client_self.roomId);
    console.log(cls);

    let message = {
        type: 'join',
        ids: cls,
    };

    // for (let i = 0; i < cls.length; i++) {
    //     if(cls[i]==client_self.id){
    //
    //     }
    //     _send(clients.get(cls[i]), JSON.stringify(message));
    // }

    _send(client_self, JSON.stringify(message));

}




/**
 * 转发客户端发送offset
 * */

function sendOffet(client_self,message){

    let msg={
        type: "offer",
        to:message.to,
        from:client_self.id,
        description:message.description,
    };


    _send(clients.get(message.to),JSON.stringify(msg));
}


/**
 * 转发Answer
 * */
function sendAnswer(client_self,message) {
    let msg={
        type: "answer",
        to:message.to,
        from:client_self.id,
        description:message.description,
    };
    _send(clients.get(message.to),JSON.stringify(msg));
}

/**
 * 转发Candidate
 * */
function sendCandidate(client_self,message){
    let msg={
        type: "candidate",
        to:message.to,
        from:client_self.id,
        candidate:message.candidate,
    };
    _send(clients.get(message.to),JSON.stringify(msg));

}


/**
 * 转发退出Leave
 * */
function sendLeave(client_self,cls) {

    var msg = {
        type: "leave",
        id: client_self.id,
    };

    cls.forEach(function (clientId) {
        _send(clients.get(clientId),JSON.stringify(msg));
    });

}



/**
 * 对www提供连接监听
 * */
function onConnection(client_self, socket) {

    console.log("--------监听到socket连接成功");
    client_self.id = _random();
    console.log('生成人员id：'+_random());
    sendConn(client_self);

    clients.set(client_self.id, client_self);
    console.log("当前在线人数：" + clients.size);

    client_self.on('close', (data) => {

        clients.delete(client_self.id);

        //判断
        if(typeof (client_self.roomId)=='undefined'){
            console.log('用户还没有进入到房间，就已经断开连接');
            return;
        }

        let cls=rooms.get(client_self.roomId);

        for(let i=0;cls!=null && i<cls.length;i++){
            if(cls[i]==client_self.id){
                cls.splice(i,1);
            }
        }

        if(cls.length<=0){
            rooms.delete(client_self.roomId);
        }else{
            sendLeave(client_self,cls);
        }

    });

    client_self.on('message', message => {

        try {
            message = JSON.parse(message);
        } catch (e) {
            console.log(e);
        }
        switch (message.type) {
            case 'join':
                console.log(client_self.id+'要加入房间：'+message.roomId);
                // console.log(rooms.has(message.roomId));
                let roomId = message.roomId;
                client_self.roomId=roomId;

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, []);
                }

                let ids = rooms.get(roomId);
                ids.push(client_self.id);

                rooms.set(roomId, ids);
                console.log('当前存在的所有房间和房间的人员：'+rooms.get(message.roomId));

                sendJoin(client_self);

                break;
            case 'offer':
                console.log(client_self.id+'发送offer给'+message.to);
                sendOffet(client_self,message);

                break;
            case 'answer':
                console.log(client_self.id+'发送answer给'+message.to);

                sendAnswer(client_self,message);
                break;
            case 'candidate':

                sendCandidate(client_self,message);

                break;

            default:
                break;


        }


    });

}

_send = (client, message) => {

    try {
        client.send(message);

    } catch (e) {
        console.log("Send {failure !: " + e);
    }
};


_random = () => {
    return new Date().getTime() + (parseInt(Math.random() * 9, 10) + 1);
};

module.exports = {
    onConnection,
};
