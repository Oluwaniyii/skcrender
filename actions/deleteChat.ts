import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import TextSchema from "../models/TextSchema";

import { clients, clientsUsers } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function deleteChat(payload: any, client: client) {
  const { socketId, user, socket } = client;
  const userId = user.id;
  const { chatId } = payload;

  const chat: any = await ChatSchema.findById(chatId);

  if (userId === chat.sender) {
    await TextSchema.findOneAndDelete({ messageId: chat.messageId });
    await MessageSchema.findByIdAndDelete(chat.messageId);
    await ChatSchema.findByIdAndDelete(chatId);

    const recieveDeleteChatPayload = {
      chatId: chat._id,
    };

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
  }
}

export default deleteChat;
