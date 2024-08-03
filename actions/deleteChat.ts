import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import ClassSchema from "../models/ClassSchema";
import ClassMembersSchema from "../models/ClassMembersSchema";
import TextSchema from "../models/TextSchema";
import MediaSchema from "../models/MediaSchema";
import CommunitySchema from "../models/CommunitySchema";
import logger from "../utils/logger";

import { clients, clientsUsers, clientsUsersId } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function deleteChat(payload: any, client: client) {
  try {
    const { socketId, user, socket } = client;
    const userId = user.id;
    const { chatId, recipient } = payload;

    const chat: any = await ChatSchema.findOne({
      cId: chatId,
      $or: [{ recipient: recipient }, { sender: recipient }],
    });

    if (!chat)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::deleteChat",
          payload: {
            message: "chat does not exist",
            chatId: chatId,
            recipient: recipient,
          },
        })
      );

    if (user.id === chat.sender || user.uid === chat.sender) {
      // raise deleteChat event to the other users
      if (chat.to === "group") {
        const group: any = await ClassSchema.findById(
          chat.recipient,
          "_id creator"
        );

        if (!group)
          return client.socket.send(
            JSON.stringify({
              eventName: "dis::deleteChat",
              payload: {
                message: "can not delete chat, channel no longer exist",
                chatId: chatId,
                recipient: recipient,
              },
            })
          );

        await ChatSchema.findByIdAndDelete(chat._id);

        // raise acknowledge deleteChat event to the user
        client.socket.send(
          JSON.stringify({
            eventName: "ack::deleteChat",
            payload: {
              message: "Chat deleted",
              chatId: chatId,
              recipient: recipient,
            },
          })
        );

        const recieveDeleteChatPayload = {
          sender: chat.sender,
          chatId: chatId,
          recipient: chat.recipient,
        };

        // send delete event to all active group members
        const members = await ClassMembersSchema.find(
          { class_id: chat.recipient },
          "class_id member_uid"
        );
        let membersIds: any[] = [group.creator];
        members.forEach((member) => membersIds.push(member.member_uid));

        const activeMembers = membersIds.filter(function (member: any) {
          return member !== userId && !!clientsUsersId[member];
        });

        activeMembers.forEach((member: any) => {
          const recipientClient = clients[clientsUsersId[member]];
          const recipientSocket = recipientClient.socket;

          recipientSocket.send(
            JSON.stringify({
              eventName: "se::receiveDeleteChat",
              payload: recieveDeleteChatPayload,
            })
          );
        });
      } else if (chat.to === "community") {
        const group: any = await CommunitySchema.findById(chat.recipient);

        if (!group)
          return client.socket.send(
            JSON.stringify({
              eventName: "dis::deleteChat",
              payload: {
                message: "can not delete chat, channel no longer exist",
                chatId: chatId,
                recipient: recipient,
              },
            })
          );

        await ChatSchema.findByIdAndDelete(chat._id);

        // raise acknowledge deleteChat event to the user
        client.socket.send(
          JSON.stringify({
            eventName: "ack::deleteChat",
            payload: {
              message: "Chat deleted",
              chatId: chatId,
              recipient: recipient,
            },
          })
        );

        const recieveDeleteChatPayload = {
          sender: chat.sender,
          chatId: chatId,
          recipient: chat.recipient,
        };

        // send delete event to all active group members
        const members: any = group.members;
        // let membersIds: any[] = [group.creator];
        let membersIds: any[] = [];
        members.forEach((member: any) => membersIds.push(member.userId));

        const activeMembers = membersIds.filter(function (member: any) {
          return member !== userId && !!clientsUsersId[member];
        });

        activeMembers.forEach((member: any) => {
          const recipientClient = clients[clientsUsersId[member]];
          const recipientSocket = recipientClient.socket;

          recipientSocket.send(
            JSON.stringify({
              eventName: "se::receiveDeleteChat",
              payload: recieveDeleteChatPayload,
            })
          );
        });
      } else {
        await ChatSchema.findByIdAndDelete(chat._id);

        // raise acknowledge deleteChat event to the user
        client.socket.send(
          JSON.stringify({
            eventName: "ack::deleteChat",
            payload: {
              message: "Chat deleted",
              recipient: chat.recipient,
              chatId: chatId,
            },
          })
        );

        const recieveDeleteChatPayload = {
          sender: chat.sender,
          chatId: chatId,
          recipient: recipient,
        };

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
      return client.socket.send(
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
    logger.error(e);
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::deleteChat",
        payload: {
          message: "can not delete chat at the moment",
          chatId: payload.chatId,
        },
      })
    );
  }
}

export default deleteChat;
