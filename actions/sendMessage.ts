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
    const { to, recipient, type, body, chatId } = payload;

    // store message
    const message: any = new MessageSchema({ type: "text" });
    const text: any = new TextSchema({ messageId: message._id, text: body });
    const chat: any = new ChatSchema({
      type: "text",
      to: to,
      sender: userId,
      recipient: recipient,
      messageId: message._id,
      cId: chatId,
      meta: {
        timestamp: new Date(),
        isRead: false,
      },
      createdAt: performance.now(),
    });

    await message.save();
    await text.save();
    await chat.save();

    // raise acknowledge message event to the sender
    client.socket.send(
      JSON.stringify({
        eventName: "ack::sendMessage",
        payload: {
          message: "message Sent",
          to: to,
          recipient: recipient,
          type: "text",
          messageId: message._id,
          chatId: chatId,
          meta: {
            timestamp: chat.meta.timestamp,
          },
        },
      })
    );

    // prepare payload
    const receiveMessagePayload = {
      from: to,
      type: type,
      sender: userId,
      recipient: recipient,
      body: body,
      chatId: chatId,
      messageId: message._id,
      meta: {
        timestamp: chat.meta.timestamp,
      },
    };

    // raise receiveMessage event to the recepient if online
    if (clientsUsers[recipient]) {
      const recepientClient = clients[clientsUsers[recipient]];
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
