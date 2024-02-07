import WebSocket from "ws";

const wss = new WebSocket.Server({ port: 8383 });
let clients = [];

wss.on("connection", function (ws: WebSocket, req: any) {
  console.log("socket connected");
  console.log(ws);

  ws.on("close", function () {});
});
