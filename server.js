var app = require('express')();
var server = require('http').Server(app);
var WebSocket = require('ws');

const port = 8888;
var wss = new WebSocket.Server({ port });

const websocketLogger = (msg) => {
  console.log(`WebSocket: ${msg}`);
};

wss.on('connection', function connection(ws) {
  websocketLogger('已连接');

  ws.on('message', function incoming(message) {
    websocketLogger(`收到消息${message}`);
    const msg = Buffer.isBuffer(message) ? message.toString() : "";

    if (msg !== "heartCheck") {

      const data = JSON.parse(message);

      if (data.command === "createUser") {
        ws.username = data.username;
        ws.send(JSON.stringify(data));
      }

      if (data.command === "chat") {
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            console.log(client.username);
            client.send(JSON.stringify(data));
          }
        });
      }
    }

  });

  ws.on('close', function close() {
    websocketLogger('已关闭');
  });

});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(3000);

websocketLogger(`server is running on ws://localhost:${port}`);