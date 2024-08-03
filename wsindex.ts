import dotenv from "dotenv";
import config from "config";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import parseUrl from "parse-url";
import jwt from "./libraries/jwt";
import actionSendMessage from "./actions/sendMessage";
import deleteChat from "./actions/deleteChat";
import { addPin, removePin } from "./actions/pin";
import sendAttachment from "./actions/sendAttachment";
import Usermodel from "./models/Usermodel";

dotenv.config();

import { clients, clientsUsers, clientsUsersId } from "./clientManager";
import { addPnSubscription, popPnSubscription } from "./Notification";

const WS_PORT: number = config.get("ws.port");
const WS_BASE: string = config.get("ws.base");

console.log(WS_PORT);
console.log(WS_BASE);

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`Websocket listening on port ${WS_PORT}`);
});

wss.on("connection", async function (ws: WebSocket, req: any) {
  const urlObject: any = parseUrl(req.url.replace("/", WS_BASE));
  const { token: bearerToken } = urlObject.query;

  if (!bearerToken) return ws.close(4000, "missing bearer token");

  // authenticate
  const authenticatedUser: any = await jwt.decode(bearerToken);
  if (!authenticatedUser) return ws.close(4000, "invalid bearer token");

  // initialize and store connection
  const socketId = uuidv4();
  const userEmail = authenticatedUser["sub"];

  const usd: any = await Usermodel.findOne({ email: userEmail }, "_id email");
  if (!usd) return ws.close(4000, "cannot sign you in");
  const uid = usd._id.toString();

  const socketObject = {
    socketId: socketId,
    user: { id: userEmail, uid: uid },
    socket: ws,
  };
  clients[socketId] = socketObject;
  clientsUsers[userEmail] = socketId; // map user email to socket id for faster search through
  clientsUsersId[uid] = socketId; // map user id to socket id for faster search through

  console.log("client connected. socketId: " + socketId);
  console.log(clientsUsers);
  console.log(clientsUsersId);

  ws.on("close", async function (...args: any[]) {
    console.log("Received close event from client " + socketId);

    await popPnSubscription(userEmail);

    if (clients[socketId]) delete clients[socketId];
    if (clientsUsers[userEmail]) delete clientsUsers[userEmail];
    if (clientsUsersId[uid]) delete clientsUsersId[uid];
    ws.close();
  });

  ws.on("message", async function (message: any) {
    const data = JSON.parse(message.toString());
    const { eventName, payload } = data;

    switch (eventName) {
      case "cl::sendMessage":
        actionSendMessage(payload, clients[socketId]);
        break;
      case "cl::sendAttachment":
        sendAttachment(payload, clients[socketId]);
        break;
      case "cl::deleteChat":
        deleteChat(payload, clients[socketId]);
        break;

      case "cl::addPin":
        addPin(payload, clients[socketId]);
        break;
      case "cl::removePin":
        removePin(payload, clients[socketId]);
        break;

      // System
      case "sys::pn::addSubscription":
        await addPnSubscription(userEmail, payload);
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
