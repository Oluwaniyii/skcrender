import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import parseUrl from "parse-url";
import jwt from "jsonwebtoken";

const wss = new WebSocket.Server({ port: 8383 }, () => {
  console.log(`ws listening on ws://localhost:8383`);
});

let clients: any = {};

wss.on("connection", async function (ws: WebSocket, req: any) {
  // verify
  const urlObject: any = parseUrl(req.url.replace("/", "ws://localhost:8383"));
  const { token: bearerToken } = urlObject.query;

  if (!bearerToken) return ws.close(4000, "missing bearer token");

  // authenticate
  const authenticatedUser: any = jwt.decode(bearerToken);
  if (!authenticatedUser) return ws.close(4000, "invalid bearer token");

  // initialize and store connection
  const socketId = uuidv4();
  const userId = authenticatedUser.data.id;

  const socketObject = {
    socketId: socketId,
    user: { id: userId },
    socket: ws,
  };
  clients[socketId] = socketObject;
  console.log("client connected. socketId: " + socketId);

  // close connection
  ws.on("close", function (...args: any[]) {
    console.log("Received close event from client " + socketId);

    if (clients[socketId]) delete clients[socketId];
    ws.close();
  });

  ws.on("message", function (message: any) {
    console.log(message.toString());
    const data = JSON.parse(message.toString());
    // console.log(data);
  });
});

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
