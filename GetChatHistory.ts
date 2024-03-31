import MessageSchema from "./models/MessageSchema";
import ChatSchema from "./models/ChatSchema";
import TextSchema from "./models/TextSchema";
import ClassSchema from "./models/ClassSchema";
import ClassMembersSchema from "./models/ClassMembersSchema";
import AppException from "./AppException";
import { domainError } from "./domainError";
import MediaSchema from "./models/MediaSchema";
import Usermodel from "./models/Usermodel";

export async function GetChatHistory(
  userEmail: string,
  convoWith: string,
  limit: number = 15,
  page: number = 1
) {
  const EMAIL_REGEXP = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (convoWith.match(EMAIL_REGEXP))
    return await GetIndividualHistory(userEmail, convoWith, limit, page);
  else return await GetGroupHistory(userEmail, convoWith, limit, page);
}

export async function GetChatConvo(
  userEmail: string,
  convoWith: string,
  chatId: string,
  limit: number = 15,
  page: number = 1
) {
  const EMAIL_REGEXP = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (convoWith.match(EMAIL_REGEXP))
    return await GetIndividualChatConvo(
      userEmail,
      convoWith,
      chatId,
      limit,
      page
    );
  else
    return await GetGroupChatConvo(userEmail, convoWith, chatId, limit, page);
}

async function GetGroupHistory(
  userEmail: string,
  convoWith: string,
  limit: number = 15,
  page: number = 1
) {
  const user: any = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `something went wrong`
    );

  const rtc: Array<any> = [];
  const pagination: any = {};

  const channel = await ClassSchema.findById(convoWith, "_id creator");

  if (!channel)
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `channel ${convoWith} no longer exist`
    );

  const members = await ClassMembersSchema.find(
    { class_id: convoWith },
    "class_id member_uid"
  );
  let membersIds: any[] = [channel.creator];
  members.forEach((member) => membersIds.push(member.member_uid));

  if (!membersIds.includes(user._id.toString()))
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `you can't send or receive messages on group ${convoWith} because you are not a member`
    );

  // fetch chat
  const query = { recipient: convoWith };
  const chats: Array<any> = await ChatSchema.find(query)
    .sort({ "meta.timestamp": "desc" })
    .limit(limit)
    .skip((page - 1) * limit);
  const sortedChats = chats.sort((a, b) => -1); // I trust mongoDB sorting already

  for (let i = 0; i < sortedChats.length; i++) {
    let chat = sortedChats[i];
    let msg: any = await retrieveChatMessage(chat.messageId);
    let senderDetails: any = await Usermodel.findById(
      chat.sender,
      "_id firstName lastName avatar"
    );

    let senderInfo = {
      id: senderDetails?._id.toString(),
      name: `${senderDetails?.firstName} ${senderDetails?.lastName}`,
      avatar: senderDetails?.avatar,
    };

    if (msg) {
      if (chat.type === "text")
        rtc.push({
          chatId: chat.cId,
          type: chat.type,
          sender: chat.sender,
          senderInfo: senderInfo,
          recipient: chat.recipient,
          messageId: chat.messageId,
          text: msg.text,
          meta: chat.meta,
        });
      else if (chat.type === "media")
        rtc.push({
          chatId: chat.cId,
          type: chat.type,
          sender: chat.sender,
          senderInfo: senderInfo,
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

  const totalEntries = (await ChatSchema.find(query, "_id")).length;
  const PAGE_LINK = `/chats/${convoWith}?limit=${limit}&page=`;
  const LAST_PAGE = Math.ceil(totalEntries / limit);

  pagination["limit"] = limit;
  pagination["page"] = page;
  pagination["totalEntries"] = totalEntries;
  pagination["current"] = `${PAGE_LINK}${page}`;
  pagination["next"] = page < LAST_PAGE ? `${PAGE_LINK}${page + 1}` : null;
  pagination["prev"] = page > 1 ? `${PAGE_LINK}${page - 1}` : null;
  pagination["last"] = `${PAGE_LINK}${LAST_PAGE}`;
  pagination["first"] = `${PAGE_LINK}1`;

  return { pagination: pagination, chats: rtc };
}

async function GetIndividualHistory(
  userEmail: string,
  convoWith: string,
  limit: number = 15,
  page: number = 1
) {
  const rtc: Array<any> = [];
  const pagination: any = {};

  const query = {
    $or: [
      { sender: convoWith, recipient: userEmail },
      { sender: userEmail, recipient: convoWith },
    ],
  };

  const chats: Array<any> = await ChatSchema.find(query)
    .sort({ "meta.timestamp": "desc" })
    .limit(limit)
    .skip((page - 1) * limit);
  const sortedChats = chats.sort((a, b) => -1); // I trust mongoDB sorting already

  for (let i = 0; i < sortedChats.length; i++) {
    let chat = sortedChats[i];
    let msg: any = await retrieveChatMessage(chat.messageId);

    if (msg) {
      if (chat.type === "text")
        rtc.push({
          chatId: chat.cId,
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

  const totalEntries = (await ChatSchema.find(query, "_id")).length;
  const PAGE_LINK = `/chats/${convoWith}?limit=${limit}&page=`;
  const LAST_PAGE = Math.ceil(totalEntries / limit);

  pagination["limit"] = limit;
  pagination["page"] = page;
  pagination["totalEntries"] = totalEntries;
  pagination["current"] = `${PAGE_LINK}${page}`;
  pagination["next"] = page < LAST_PAGE ? `${PAGE_LINK}${page + 1}` : null;
  pagination["prev"] = page > 1 ? `${PAGE_LINK}${page - 1}` : null;
  pagination["last"] = `/chats/${convoWith}?limit=${limit}&page=${LAST_PAGE}`;
  pagination["first"] = `/chats/${convoWith}?limit=${limit}&page=1`;

  return { pagination: pagination, chats: rtc };
}

async function GetIndividualChatConvo(
  userEmail: string,
  convoWith: string,
  chatId: string,
  limit: number = 4,
  page: number = 1
) {
  const chat: any = await ChatSchema.findOne(
    {
      cId: chatId,
      $or: [{ recipient: convoWith }, { sender: convoWith }],
    },
    "cId to sender recipient meta createdAt"
  );

  if (!chat)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);

  const totalEntries = (
    await ChatSchema.find(
      {
        $or: [
          { sender: convoWith, recipient: userEmail },
          { sender: userEmail, recipient: convoWith },
        ],
      },
      "_id"
    )
  ).length;

  const chatOffset = (
    await ChatSchema.find(
      {
        $or: [
          { sender: convoWith, recipient: userEmail },
          { sender: userEmail, recipient: convoWith },
        ],
        "meta.timestamp": { $lte: chat.meta.timestamp },
      },
      "_id"
    )
  ).length;

  const chatIndex = totalEntries - chatOffset + 1;
  const chatPage = Math.ceil(chatIndex / limit);
  const lastPage = Math.ceil(totalEntries / limit);

  let chats: any = await GetChatHistory(userEmail, convoWith, limit, chatPage);

  return chats;
}

async function GetGroupChatConvo(
  userEmail: string,
  convoWith: string,
  chatId: string,
  limit: number = 15,
  page: number = 1
) {
  const user: any = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `something went wrong`
    );

  const rtc: Array<any> = [];
  const pagination: any = {};

  const channel = await ClassSchema.findById(convoWith, "_id creator");

  if (!channel)
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `channel ${convoWith} no longer exist`
    );

  const members = await ClassMembersSchema.find(
    { class_id: convoWith },
    "class_id member_uid"
  );
  let membersIds: any[] = [channel.creator];
  members.forEach((member) => membersIds.push(member.member_uid));

  if (!membersIds.includes(user._id.toString()))
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `you can't send or receive messages on group ${convoWith} because you are not a member`
    );

  const chat: any = await ChatSchema.findOne(
    {
      cId: chatId,
      recipient: convoWith,
    },
    "cId to sender recipient meta createdAt"
  );

  if (!chat)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);

  const totalEntries = (await ChatSchema.find({ recipient: convoWith }, "_id"))
    .length;

  const chatOffset = (
    await ChatSchema.find(
      { recipient: convoWith, "meta.timestamp": { $lte: chat.meta.timestamp } },
      "_id"
    )
  ).length;

  const chatIndex = totalEntries - chatOffset + 1;
  const chatPage = Math.ceil(chatIndex / limit);
  const lastPage = Math.ceil(totalEntries / limit);

  let chats: any = await GetChatHistory(userEmail, convoWith, limit, chatPage);

  return chats;
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

export default GetChatHistory;
