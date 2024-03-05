import MessageSchema from "./models/MessageSchema";
import ChatSchema from "./models/ChatSchema";
import TextSchema from "./models/TextSchema";
import ClassChannelSchema from "./models/ClassChannelSchema";
import AppException from "./AppException";
import { domainError } from "./domainError";
import MediaSchema from "./models/MediaSchema";

async function GetChatHistory(
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

async function GetGroupHistory(
  userEmail: string,
  convoWith: string,
  limit: number = 15,
  page: number = 1
) {
  const rtc: Array<any> = [];
  const pagination: any = {};

  const channel = await ClassChannelSchema.findById(convoWith, "_id members");

  if (!channel)
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `channel ${convoWith} no longer exist`
    );

  if (!channel.members.includes(userEmail))
    throw new AppException(
      domainError.CHANNEL_MEMBER_ERROR,
      `you can't send or receive messages on group ${convoWith} because you are not a member`
    );

  const query = { recipient: convoWith };
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
  pagination["next"] = page < LAST_PAGE ? `${PAGE_LINK}${page + 1}` : null;
  pagination["prev"] = page > 1 ? `${PAGE_LINK}${page - 1}` : null;
  pagination["last"] = `${PAGE_LINK}${LAST_PAGE}`;
  pagination["first"] = `${PAGE_LINK}1`;

  return { pagination: pagination, chats: rtc };
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
