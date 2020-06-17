const WebSocket = require('ws');
var rpio = require('rpio'); //define uso do rpio


LED = 37
 
var ledState = 0 //define estado do led
 
rpio.open(LED, rpio.OUTPUT, rpio.LOW)
var reconnect;

function isJson(str) {
    try {
        JSON.parse(str);
    }
    catch (e) {
        return false;
    }
    return true;
}
function init(){
    const ws = new WebSocket('ws:192.168.15.15:8080');
    ws.on('open', function open() {
        console.log('Connect')
        clearInterval(reconnect)
        ws.send(JSON.stringify({ action: 'join', name: 'rpi' }));
    
    });
    ws.on('message', function incoming(message) {

        if (message === 'ping') {
            ws.send('pong')
            console.log('ping')
        }
        else if (isJson(message.data)) {
    
        }
        else if(message == 'led'){
            ledState = !ledState; //troca estado do led
            if(ledState == 0) rpio.write(LED, rpio.HIGH); //acende LED
            else rpio.write(LED, rpio.LOW); //apaga LED
    
        }
    });
    ws.on('close', function close(){
        console.log('Disconnected')
        console.log('Trying to reconnect')
        reconnect = setInterval(init,5000)
    })
}
init();



