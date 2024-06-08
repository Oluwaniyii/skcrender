import Usermodel from "../models/Usermodel";
import AppException from "../AppException";
import { domainError } from "../domainError";
import ChatSchema from "../models/ChatSchema";
import ClassSchema from "../models/ClassSchema";
import PinSchema from "../models/PinSchema";
import ClassMembersSchema from "../models/ClassMembersSchema";
import TextSchema from "../models/TextSchema";
import MediaSchema from "../models/MediaSchema";
import MessageSchema from "../models/MessageSchema";
import logger from "../utils/logger";
import CommunitySchema from "../models/CommunitySchema";

import { clients, clientsUsers, clientsUsersId } from "../clientManager";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

export async function addPin(payload: any, client: client) {
  try {
    const { classId, chatId } = payload;
    const { id: userEmail, uid: userId } = client.user;

    const user = await Usermodel.findOne({ email: userEmail }, "_id");
    if (!user)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::addPin",
          payload: {
            message: "something went wrong",
            chatId: chatId,
          },
        })
      );

    const chat: any = await ChatSchema.findOne({ cId: chatId });
    if (!chat)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::addPin",
          payload: {
            message: "chat does not exist",
            chatId: chatId,
          },
        })
      );

    const group: any =
      chat.to === "group"
        ? await ClassSchema.findById(classId, "_id creator")
        : await CommunitySchema.findById(classId);

    if (!group)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::addPin",
          payload: {
            message: "you cannot pin chat because group no longer exist",
            chatId: chatId,
          },
        })
      );

    if (user._id.toString() !== group.creator)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::addPin",
          payload: {
            message:
              "you cannot pin this chat because you are not the group owner",
            chatId: chatId,
          },
        })
      );

    let pin: any = await PinSchema.findOne({ class_id: classId });
    let pinsCount: number = 0;

    if (pin) {
      if (!pin.pins.includes(chatId)) {
        pin.pins.push(chatId);
        await pin.save();
      } else {
        return client.socket.send(
          JSON.stringify({
            eventName: "ack::addPin",
            payload: {
              message: "chat already pinned",
              chatId: chatId,
              pinsCount: pin.pins.length,
            },
          })
        );
      }
    } else {
      pin = new PinSchema({ class_id: classId, pins: [chatId] });
      await pin.save();
    }
    await pin.save();

    pinsCount = pin.pins.length;

    // raise acknowledge message event to the sender
    client.socket.send(
      JSON.stringify({
        eventName: "ack::addPin",
        payload: {
          message: "chat Pinned",
          chatId: chatId,
          pinsCount: pin.pins.length,
        },
      })
    );

    // send message to all active members excluding sender
    // filter group active members
    let members: any[];
    let membersIds: any[];

    if (chat.to === "community") {
      members = group.members;
      membersIds = [];
      members.forEach((member: any) => membersIds.push(member.userId));
    } else {
      members = await ClassMembersSchema.find(
        { class_id: classId },
        "class_id member_uid"
      );
      membersIds = [group.creator];
      members.forEach((member: any) => membersIds.push(member.member_uid));
    }

    const activeMembers = membersIds.filter(function (member: any) {
      return member !== userId && !!clientsUsersId[member];
    });

    activeMembers.forEach((member: any) => {
      const recipientClient = clients[clientsUsersId[member]];
      const recipientSocket = recipientClient.socket;

      recipientSocket.send(
        JSON.stringify({
          eventName: "se::newPin",
          payload: {
            message: "new pinned chat",
            chatId: chatId,
            classId: classId,
            pinsCount: pin.pins.length,
          },
        })
      );
    });
  } catch (e) {
    client.socket.send(
      JSON.stringify({
        eventName: "dis::addPin",
        payload: {
          message: "pin chat failed",
          chatId: payload.chatId,
        },
      })
    );
    logger.error(e);
  }
}

export async function removePin(payload: any, client: client) {
  try {
    const { classId, chatId } = payload;
    const { id: userEmail, uid: userId } = client.user;

    const user = await Usermodel.findOne({ email: userEmail }, "_id");
    if (!user)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message: "something went wrong",
            chatId: chatId,
          },
        })
      );

    const chat: any = await ChatSchema.findOne({ cId: chatId });
    if (!chat)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message: "chat does not exist",
            chatId: chatId,
          },
        })
      );

    const group: any =
      chat.to === "group"
        ? await ClassSchema.findById(classId, "_id creator")
        : await CommunitySchema.findById(classId);

    if (!group)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message: "cannot perform action because group no longer exist",
            chatId: chatId,
          },
        })
      );

    if (user._id.toString() !== group.creator)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message:
              "you cannot perform this action because you are not the group owner",
            chatId: chatId,
          },
        })
      );

    let pin: any = await PinSchema.findOne({ class_id: classId });
    let pinsCount: number = 0;

    if (!pin)
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message: "chat is not pinned",
            chatId: chatId,
          },
        })
      );

    if (!pin.pins.includes(chatId))
      return client.socket.send(
        JSON.stringify({
          eventName: "dis::removePin",
          payload: {
            message: "chat is not pinned",
            chatId: chatId,
          },
        })
      );

    pin.pins = pin.pins.filter((pinId: string) => pinId !== chatId);
    await pin.save();
    pinsCount = pin.pins.length;

    // raise acknowledge message event to the sender
    client.socket.send(
      JSON.stringify({
        eventName: "ack::removePin",
        payload: {
          message: "chat unpinned",
          chatId: chatId,
          pinsCount: pin.pins.length,
        },
      })
    );

    // send message to all active members excluding sender
    // filter group active members
    let members: any[];
    let membersIds: any[];

    if (chat.to === "community") {
      members = group.members;
      membersIds = [];
      members.forEach((member: any) => membersIds.push(member.userId));
    } else {
      members = await ClassMembersSchema.find(
        { class_id: classId },
        "class_id member_uid"
      );
      membersIds = [group.creator];
      members.forEach((member: any) => membersIds.push(member.member_uid));
    }

    const activeMembers = membersIds.filter(function (member: any) {
      return member !== userId && !!clientsUsersId[member];
    });

    activeMembers.forEach((member: any) => {
      const recipientClient = clients[clientsUsersId[member]];
      const recipientSocket = recipientClient.socket;

      recipientSocket.send(
        JSON.stringify({
          eventName: "se::removePin",
          payload: {
            message: "chat unpinned",
            chatId: chatId,
            classId: classId,
            pinsCount: pin.pins.length,
          },
        })
      );
    });
  } catch (e) {
    client.socket.send(
      JSON.stringify({
        eventName: "dis::removePin",
        payload: {
          message: "message send failed",
          chatId: payload.chatId,
        },
      })
    );
    logger.error(e);
  }
}

export async function getPins(userEmail: string, classId: string) {
  const user = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);
  const userId = user._id.toString();

  const isClass = await ClassSchema.findById(classId, "_id creator");
  const isCommunity = await CommunitySchema.findById(classId);

  const group: any = isClass || isCommunity;
  if (!group)
    throw new AppException(domainError.NOT_FOUND, `channel no longer exist`);

  // check if member
  let isMember = isClass
    ? !!(await ClassMembersSchema.findOne({
        class_id: classId,
        member_uid: userId,
      }))
    : !!group.members.find((member: any) => member.userId === userId);

  if (userId !== group.creator && !!isMember !== true)
    throw new AppException(
      domainError.NOT_FOUND,
      `you cannot access group pins beacause you are not a member`
    );

  // load chats
  let pinsCount: number = 0;
  let chats: any[] = [];
  let rtc: any[] = [];

  let pin = await PinSchema.findOne({ class_id: classId });
  if (!pin) return { chats: rtc, pinsCount: pinsCount };

  pinsCount = pin.pins.length;

  for (let i = 0; i < pin.pins.length; i++) {
    const pinId = pin.pins[i];
    const chat = await ChatSchema.findOne({ cId: pinId });
    if (chat) chats.push(chat);
  }

  for (let i = 0; i < chats.length; i++) {
    let chat = chats[i];
    let msg: any = await retrieveChatMessage(chat.messageId);

    if (msg) {
      if (chat.type === "text")
        rtc.push({
          chatId: chat.cId,
          to: chat.to,
          type: chat.type,
          sender: chat.sender,
          recipient: chat.recipient,
          messageId: chat.messageId,
          text: msg.text,
          meta: chat.meta,
        });
      else if (chat.type === "media")
        rtc.push({
          chatId: chat.cId,
          to: chat.to,
          type: chat.type,
          sender: chat.sender,
          recipient: chat.recipient,
          messageId: chat.messageId,
          name: msg.name,
          size: msg.size,
          mediaType: msg.mediaType,
          mediaExtension: msg.mediaExtension,
          url: msg.url,
          meta: chat.meta,
        });
    }
  }

  return { chats: rtc, pinsCount: pinsCount };
}

async function retrieveChatMessage(messageId: string) {
  const msg: any = await MessageSchema.findById(messageId);

  if (msg.type === "text") {
    return await TextSchema.findOne({ messageId: messageId });
  } else if (msg.type === "media") {
    return await MediaSchema.findOne({ messageId: messageId });
  } else {
    return null;
  }
}

export default addPin;
