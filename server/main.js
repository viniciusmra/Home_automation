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

var nedb = require('nedb');
var logdb = new nedb({ filename: 'log.db' })
logdb.loadDatabase();
logdb.insert({ timeStamp: Date.now(), action: 'start', name: 'server' })

var userListList = ['browser']
var statusList = ['browser']
var userList = [];
var keepAliveInterval = 10000; //5 seconds


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

    var interval = setInterval(function () {
        if (ws.keepAlive) {
            ws.send('ping')
            ws.keepAlive = false;
        }
        else {
            ws.terminate()
        }
    }, keepAliveInterval);

    function sendCommand(obj) {
        var found = false;
        wss.clients.forEach(function each(ws) {
            if (ws.name === obj.target) {
                ws.send(JSON.stringify({ action: 'command', channel: obj.channel, command: obj.command }))
                found = true;
            }
        })
        return found
    }
    function sendStatus(obj) {
        wss.clients.forEach(function each(ws) {
            for (let i = 0; i < statusList.length; i++) {
                if (ws.name == statusList[i]) {
                    ws.send(JSON.stringify({action: 'status', name: obj.name, ch1: obj.ch1, ch2: obj.ch2, ch3: obj.ch3, ch4: obj.ch4, ch5: obj.ch5 }))
                }
            }
        })
    }
    function sendUserList() {
        wss.clients.forEach(function each(ws) {
            for (let i = 0; i < userListList.length; i++) {
                if (ws.name == userListList[i]) {
                    ws.send(JSON.stringify({ userList: userList }))
                }
            }
        })

    }

    //WebSocket message receive handler
    ws.on('message', function incoming(message) {
        if (message == 'pong') {
            ws.keepAlive = true;
        }
        else if (isJson(message)) {
            var obj = JSON.parse(message);
            //console.log(obj)
            if (obj.action === 'join') {
                console.log('Join:', obj.name.toLocaleLowerCase());
                ws.name = obj.name.toLocaleLowerCase()
                ws.keepAlive = true;
                if (userList.filter(function (e) { return e.name == obj.name.toLowerCase(); }).length <= 0) {
                    userList.push({ name: obj.name.toLowerCase() });
                }
                sendUserList()
                logdb.insert({ timeStamp: Date.now(), action: obj.action, name: obj.name })
            }
            else if (obj.action === 'command') {
                if (sendCommand(obj)) {
                    console.log('Command: ' + ws.name + ' > ' + obj.target + ' true')
                    logdb.insert({ timeStamp: Date.now(), action: 'command', name: ws.name, target: obj.target, channel: obj.channel, command: obj.command, sent: true })
                }
                else {
                    console.log('Command: ' + ws.name + ' > ' + obj.target + ' false')
                    logdb.insert({ timeStamp: Date.now(), action: 'command', name: ws.name, target: obj.target, channel: obj.channel, command: obj.command, sent: false })
                }
            }
            else if (obj.action === 'status') {
                console.log('Status: ' + ws.name)
                obj.name = ws.name
                logdb.insert({ timeStamp: Date.now(), action: 'status', name: obj.name, ch1: obj.ch1, ch2: obj.ch2, ch3: obj.ch3, ch4: obj.ch4, ch5: obj.ch5 })
                sendStatus(obj)
            }
        }
        else {
            console.log('Server - received: %s', message.toString())
        }

        return false;
    });
    ws.on('close', function close() {
        logdb.insert({ timeStamp: Date.now(), action: 'close', name: ws.name })
        clearInterval(interval)
        console.log('Disconnect:', ws.name)
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].name === ws.name) {
                userList.splice(i, 1);
            }
        }
        sendUserList()
    })
});

