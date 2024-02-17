import dotenv from "dotenv";
import config from "config";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import parseUrl from "parse-url";
import jwt from "jsonwebtoken";
import actionSendMessage from "./actions/sendMessage";
import deleteChat from "./actions/deleteChat";

dotenv.config();

import { clients, clientsUsers } from "./clientManager";

const WS_PORT: number = config.get("ws.port");
const WS_HOST: string = config.get("ws.base");

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`Websocket listening on ${WS_HOST}`);
});

wss.on("connection", async function (ws: WebSocket, req: any) {
  const urlObject: any = parseUrl(req.url.replace("/", WS_HOST));
  const { token: bearerToken } = urlObject.query;

  if (!bearerToken) return ws.close(4000, "missing bearer token");

  // authenticate
  const authenticatedUser: any = jwt.decode(bearerToken);
  if (!authenticatedUser) return ws.close(4000, "invalid bearer token");

  // initialize and store connection
  const socketId = uuidv4();
  const userId = authenticatedUser["sub"];

  const socketObject = {
    socketId: socketId,
    user: { id: userId },
    socket: ws,
  };
  clients[socketId] = socketObject;
  clientsUsers[userId] = socketId; // map user id to socket id for faster search through
  console.log("client connected. socketId: " + socketId);
  console.log(clientsUsers);

  // close connection
  ws.on("close", function (...args: any[]) {
    console.log("Received close event from client " + socketId);

    if (clients[socketId]) delete clients[socketId];
    if (clientsUsers[userId]) delete clientsUsers[userId];
    ws.close();
  });

  //
  ws.on("message", function (message: any) {
    const data = JSON.parse(message.toString());
    const { eventName, payload } = data;

    switch (eventName) {
      case "cl::sendMessage":
        actionSendMessage(payload, clients[socketId]);
        break;
      case "cl::deleteMessage":
        deleteChat(payload, clients[socketId]);
        break;
    }
  });
});

type sendMessagePayload = {
  to: string;
  id: string;
  type: "text";
  body: string;
};

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

// support
function closeSocketOnError(
  socket: WebSocket,
  socketId: string,
  code: number,
  message: string
) {
  if (clients[socketId]) delete clients[socketId];
  socket.close(code, message);

  console.log(Object.keys(clients).length);
  console.log([socketId]);
}

function closeSocket(
  socket: WebSocket,
  socketId: string,
  code: number,
  message: string
) {
  if (clients[socketId]) delete clients[socketId];
  socket.close(code, message);

  console.log(Object.keys(clients).length);
  console.log([socketId]);
}
