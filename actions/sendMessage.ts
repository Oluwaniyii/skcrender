import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import TextSchema from "../models/TextSchema";
import logger from "../utils/logger";

import { clients, clientsUsers } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function sendMessage(payload: any, client: client) {
  try {
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
      meta: {
        timestamp: new Date(),
        isRead: false,
      },
      createdAt: performance.now(),
    });

    await message.save();
    await text.save();
    await chat.save();

    // prepare payload
    const receiveMessagePayload = {
      from: to,
      type: type,
      sender: userId,
      recipient: id,
      body: body,
      chatId: chat._id,
      messageId: message._id,
      meta: {
        timestamp: chat.meta.timestamp,
      },
    };

    // raise acknowledge message event to the sender
    client.socket.send(
      JSON.stringify({
        eventName: "ack::sendMessage",
        payload: {
          message: "message Sent",
          chatId: chat._id,
          messageId: message._id,
          meta: {
            timestamp: chat.meta.timestamp,
          },
        },
      })
    );

    // raise receiveMessage event to the recepient if online
    if (clientsUsers[id]) {
      const recepientClient = clients[clientsUsers[id]];
      const recepientSocket = recepientClient.socket;

      recepientSocket.send(
        JSON.stringify({
          eventName: "se::receiveMessage",
          payload: receiveMessagePayload,
        })
      );
    }
  } catch (e) {
    client.socket.send(
      JSON.stringify({
        eventName: "dis::sendMessage",
        payload: {
          message: "message send failed",
        },
      })
    );
    logger.error(e);
  }
}

export default sendMessage;
