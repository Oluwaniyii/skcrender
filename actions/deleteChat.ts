import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import ClassChannelSchema from "../models/ClassChannelSchema";
import TextSchema from "../models/TextSchema";
import MediaSchema from "../models/MediaSchema";
import logger from "../utils/logger";

import { clients, clientsUsers } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function deleteChat(payload: any, client: client) {
  try {
    const { socketId, user, socket } = client;
    const userId = user.id;
    const { chatId } = payload;

    const chat: any = await ChatSchema.findById(chatId);

    if (userId === chat.sender) {
      await ChatSchema.findByIdAndDelete(chatId);

      const recieveDeleteChatPayload = {
        from: userId,
        to: chat.recipient,
        chatId: chat._id,
      };

      // raise acknowledge deleteChat event to the user
      client.socket.send(
        JSON.stringify({
          eventName: "ack::deleteChat",
          payload: {
            message: "Chat deleted",
            to: chat.recipient,
            chatId: chat._id,
          },
        })
      );

      // raise deleteChat event to the other users
      if (chat.to === "group") {
        const group: any = await ClassChannelSchema.findById(chat.recipient);
        const activeMembers = group.members.filter(function (member: any) {
          return member !== userId && !!clientsUsers[member];
        });

        activeMembers.forEach((member: any) => {
          const recipientClient = clients[clientsUsers[member]];
          const recipientSocket = recipientClient.socket;

          recipientSocket.send(
            JSON.stringify({
              eventName: "se::receiveDeleteChat",
              payload: recieveDeleteChatPayload,
            })
          );
        });
      } else {
        if (clientsUsers[chat.recipient]) {
          const recipientClient = clients[clientsUsers[chat.recipient]];
          const recipientSocket = recipientClient.socket;

          recipientSocket.send(
            JSON.stringify({
              eventName: "se::receiveDeleteChat",
              payload: recieveDeleteChatPayload,
            })
          );
        }
      }
    } else {
      client.socket.send(
        JSON.stringify({
          eventName: "dis::deleteChat",
          payload: {
            message: "can not delete chat, you are not the sender",
            chatId: chatId,
          },
        })
      );
    }
  } catch (e) {
    client.socket.send(
      JSON.stringify({
        eventName: "dis::deleteChat",
        payload: {
          message: "can not delete chat at the moment",
          chatId: payload.chatId,
        },
      })
    );
    logger.error(e);
  }
}

export default deleteChat;
