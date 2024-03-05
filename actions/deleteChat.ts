import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
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
      await MessageSchema.findByIdAndDelete(chat.messageId);
      await ChatSchema.findByIdAndDelete(chatId);

      const recieveDeleteChatPayload = {
        chatId: chat._id,
      };

      // raise acknowledge deleteChat event to the user
      client.socket.send(
        JSON.stringify({
          eventName: "ack::deleteChat",
          payload: {
            message: "Chat deleted",
            chatId: chat._id,
          },
        })
      );

      // raise deleteChat event to the other user
      if (clientsUsers[chat.recipient]) {
        const recepientClient = clients[clientsUsers[chat.recipient]];
        const recepientSocket = recepientClient.socket;

        recepientSocket.send(
          JSON.stringify({
            eventName: "se::receiveDeleteChat",
            payload: recieveDeleteChatPayload,
          })
        );
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
