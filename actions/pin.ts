import Usermodel from "../models/Usermodel";
import AppException from "../AppException";
import { domainError } from "../domainError";
import ChatSchema from "../models/ChatSchema";
import ClassSchema from "../models/ClassSchema";
import PinSchema from "../models/PinSchema";
import BookmarkSchema from "../models/BookmarkSchema";
import ClassMembersSchema from "../models/ClassMembersSchema";
import TextSchema from "../models/TextSchema";
import MediaSchema from "../models/MediaSchema";
import MessageSchema from "../models/MessageSchema";

export async function addPin(
  userEmail: string,
  classId: string,
  chatId: string
) {
  const user = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);

  const group: any = await ClassSchema.findById(classId, "_id creator");
  if (!group)
    throw new AppException(
      domainError.NOT_FOUND,
      `you cannot pin chat because group no longer exist`
    );

  const chat: any = await ChatSchema.findOne({ cId: chatId }, "cId");
  if (!chat)
    throw new AppException(domainError.NOT_FOUND, `chat does not exist`);

  if (user._id.toString() !== group.creator)
    throw new AppException(
      domainError.NOT_FOUND,
      `you cannot pin this chat because you are not the group owner`
    );

  let pin = await PinSchema.findOne({ class_id: classId });
  if (pin) {
    if (!pin.pins.includes(chatId)) {
      pin.pins.push(chatId);
      await pin.save();
    }
  } else {
    pin = new PinSchema({
      class_id: classId,
      pins: [chatId],
    });
    await pin.save();
  }

  return { pinsCount: pin.pins.length };
}

export async function getPins(userEmail: string, classId: string) {
  console.log(userEmail, classId);
  const user = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);
  const userId = user._id.toString();

  const group: any = await ClassSchema.findById(classId, "_id creator");
  if (!group)
    throw new AppException(domainError.NOT_FOUND, `group no longer exist`);

  const isMember = !!(await ClassMembersSchema.findOne({
    class_id: classId,
    member_uid: userId,
  }));

  if (userId !== group.creator && isMember !== true)
    throw new AppException(
      domainError.NOT_FOUND,
      `you cannot access group pins beacause you are not a memeber`
    );

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
