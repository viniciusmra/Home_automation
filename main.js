const express = require('express');
const app = express();
const http_port = 3000
const ws_port = 8080
const ip = '192.168.15.15'

app.listen(http_port, ip, function () {
    console.log('\nEscutando em ' + ip + ':' + http_port + '\n')
})

app.use(express.static('public'))
app.use(express.json({ limit: '1mb' }))
app.get('/', function (request, response) {
    response.send('>>\r\n0')
    console.log('HTTP REQUEST')
})

var WebSocketServer = require('ws').Server
wss = new WebSocketServer({
    host: ip,
    port: ws_port,
    server: app
})

var userList = [];
var keepAliveInterval = 2000; //5 seconds

//JSON string parser
function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}

//WebSocket connection open handler
wss.on('connection', function connection(ws) {

    function removeUser(client) {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].name === client) {
                userList.splice(i, 1);
            }
        }

    }
    var interval = setInterval(function () {
        if (ws.keepAlive) {
            ws.send('ping')
            ws.keepAlive = false;
        }
        else {
            ws.close()
            clearInterval(interval)
            console.log('Disconnect:', ws.name)]
            removeUser(ws.name)
        }
    }, keepAliveInterval);
    function sendCommand(device, channel, command){

    }
    function sendStatus(device, channel, status){

    }

    //WebSocket message receive handler
    ws.on('message', function incoming(message) {
        if (message == 'pong') {
            ws.keepAlive = true;
        }
        else if (isJson(message)) {
            var obj = JSON.parse(message);

            //client is responding to keepAlive
            if (obj.keepAlive !== undefined) {
                pong(obj.keepAlive.toLowerCase());
            }

            if (obj.action === 'join') {
                console.log('Join:', obj.name.toLocaleLowerCase());
                ws.name = obj.name.toLocaleLowerCase()
                ws.keepAlive = true;
                //start pinging to keep alive

                if (userList.filter(function (e) { return e.name == obj.name.toLowerCase(); }).length <= 0) {
                    userList.push({ name: obj.name.toLowerCase() });
                }
                console.log('User List:', userList)

            }
            if (obj.action === 'command') {
                sendCommand(obj.device, obj.channel, obj.command)
            }
            if(obj.action === 'status'){
                console.log(obj.data)
                //sendStatus(ws.name, obj.channel, obj.status)
            }
        }
        else {
            console.log('Server - received: %s', message.toString())
        }

        return false;
    });
    wss.on('close', function close() {
        console.log('fechado')
    })
});

