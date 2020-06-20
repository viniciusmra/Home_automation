const WebSocket = require('ws');
var rpio = require('rpio'); //define uso do rpio


LED = 37
sensor = 35
mode = 2

var abs

var ledState = 0 //define estado do led
var statusUpdate = true;
var ledTimeout = 7000;
var command = false;
var auto = true;
var timer = 0;
var online = false

rpio.open(LED, rpio.OUTPUT, rpio.LOW)
rpio.open(sensor, rpio.INPUT)
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
        ws.send(JSON.stringify({ action: 'join', name: 'rpi' }))
        setInterval(function(){
            if(statusUpdate){
                ws.send(JSON.stringify({ action: 'status', ch1: rpio.read(LED)}))
                statusUpdate = false
            }
        },100)
    });
    
    
    ws.on('message', function incoming(message) {

        if (message === 'ping') {
            ws.send('pong')
            console.log('ping')
        }
        else if (isJson(message)) {
            var obj = JSON.parse(message)
            if(obj.action === 'command'){
                if(obj.channel == 1){
                    ledState = obj.command
                    command = true
                }
                else if(obj.channel == 3){
                    mode = obj.command
                }
                control();
            }
        }
    });
    ws.on('close', function close(){
        console.log('Disconnected')
        console.log('Trying to reconnect')
        online = false
        reconnect = setInterval(init,5000)
    })
}
function control(){
    if(mode == 1){
        if(ledState == 1) rpio.write(LED, rpio.HIGH)
        else rpio.write(LED, rpio.LOW)
    }
    else if(mode == 2){
        if(command && ledState && !rpio.read(LED)){
            rpio.write(LED, rpio.HIGH)
            statusUpdate = true
            auto = true
            timer = Date.now()
            command = false
        }
        else if(command && !ledState && rpio.read(LED)){
            rpio.write(LED, rpio.LOW)
            statusUpdate = true
            auto = false
            command = false
        }
        else if(auto){
            if(rpio.read(sensor)){
                if(!rpio.read(LED)){
                    rpio.write(LED, rpio.HIGH)
                    statusUpdate = true
                }
                timer = Date.now()
            }
            else if(Date.now() - timer > ledTimeout && rpio.read(LED)){
                rpio.write(LED, rpio.LOW)
                statusUpdate = true
            }
        }
    }
}
setInterval(control,500)
init();







