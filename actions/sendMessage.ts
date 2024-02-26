import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import TextSchema from "../models/TextSchema";
import ClassChannelSchema from "../models/ClassChannelSchema";
import logger from "../utils/logger";

import { clients, clientsUsers } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function sendMessage(payload: any, client: client) {
  try {
    const messageGroup = payload.to;
    if (messageGroup === "individual") await sendToIndividual(payload, client);
    else if (messageGroup === "group") await sendToGroup(payload, client);
    else {
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

async function sendToIndividual(payload: any, client: client) {
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
        chatId: chat.cId,
        messageId: message._id,
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
    chatId: chat.cId,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // raise receiveMessage event to the recipient if online
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
}

async function sendToGroup(payload: any, client: client) {
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
        chatId: chatId,
        messageId: message._id,
        meta: {
          timestamp: chat.meta.timestamp,
        },
      },
    })
  );

  // populate message to all active members excluding owner

  // filter active members
  const group = await ClassChannelSchema.findById(recipient);
  if (!group) return; //

  const activeMembers = group.members.filter(function (member) {
    return member !== userId && !!clientsUsers[member];
  });

  const receiveMessagePayload: any = {
    from: to,
    type: type,
    sender: userId,
    body: body,
    chatId: chatId,
    recipient: recipient,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // send message to all active members
  activeMembers.forEach((member) => {
    const recepientClient = clients[clientsUsers[member]];
    const recepientSocket = recepientClient.socket;

    recepientSocket.send(
      JSON.stringify({
        eventName: "se::receiveMessage",
        payload: receiveMessagePayload,
      })
    );
  });
}

export default sendMessage;
