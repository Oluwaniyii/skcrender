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
          chatId: payload.chatId,
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
        to: to,
        recipient: recipient,
        type: "text",
        chatId: chatId,
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
    chatId: chatId,
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

  // Group has to exist
  // You have to be a member of the group
  const group: any = await ClassChannelSchema.findById(recipient);

  if (!group)
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendMessage",
        payload: {
          message: `channel ${recipient} does not exist`,
          chatId: chatId,
        },
      })
    );

  if (!group.members.includes(userId))
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendMessage",
        payload: {
          message: `you can't send or receive messages on group ${recipient} because you are not a member`,
          chatId: chatId,
        },
      })
    );

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
        chatId: chatId,
        messageId: message._id,
        meta: {
          timestamp: chat.meta.timestamp,
        },
      },
    })
  );

  // populate message to all active members excluding owner
  // filter group active members
  const activeMembers = group.members.filter(function (member: any) {
    return member !== userId && !!clientsUsers[member];
  });

  const receiveMessagePayload: any = {
    type: type,
    from: to,
    sender: userId,
    recipient: recipient,
    body: body,
    chatId: chatId,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // send message to all active members
  activeMembers.forEach((member: any) => {
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
