const WebSocket = require('ws');

const ws = new WebSocket('ws:192.168.15.15:8080');

function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}

ws.on('open', function open() {
    ws.send(JSON.stringify({ action: 'join', name: 'rpi' }));
});

ws.on('message', function incoming(message) {

    if (message === 'ping') {
        ws.send('pong')
        console.log('ping')
    }
    else if (isJson(message.data)) {

    }
});