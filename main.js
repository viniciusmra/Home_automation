const express = require('express');
const app = express();
const http_port = 80
const ws_port = 8080
const ip = '127.0.0.1'

app.listen(http_port,ip,function(){
    console.log('Escutando em ' + ip + ':' + http_port)
})

app.use(express.static('public'))
app.use(express.json({limit: '1mb'}))
app.get('/', function(request, response){
    response.send('>>\r\n0')
    console.log('HTTP REQUEST')
})
