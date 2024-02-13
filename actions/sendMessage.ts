import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import TextSchema from "../models/TextSchema";

import { clients, clientsUsers } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function sendMessage(payload: any, client: client) {
  const { socketId, user, socket } = client;
  const userId = user.id;
  const { to, id, type, body } = payload;

  // store message
  const message: any = new MessageSchema({ type: "text" });
  const text: any = new TextSchema({ messageId: message._id, text: body });
  const chat: any = new ChatSchema({
    type: "text",
    to: to,
    sender: userId,
    recipient: id,
    messageId: message._id,
  });
  await message.save();
  await text.save();
  await chat.save();

  // prepare payload
  const receiveMessagePayload = {
    from: to,
    sender: userId,
    recipient: id,
    body: body,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // check if user is online
  if (clientsUsers[id]) {
    const client = clients[clientsUsers[id]];
    const clientSocket = client.socket;

    // publish receiveMessage event to client
    clientSocket.send(
      JSON.stringify({
        eventName: "se::receiveMessage",
        payload: receiveMessagePayload,
      })
    );
  }
}

export default sendMessage;
