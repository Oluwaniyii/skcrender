import MessageSchema from "./models/MessageSchema";
import ChatSchema from "./models/ChatSchema";
import TextSchema from "./models/TextSchema";

async function GetChatHistory(
  userEmail: string,
  convoWithUserEmail: string,
  limit: number = 15,
  page: number = 1
) {
  const convoWith = convoWithUserEmail;
  const currentUser = userEmail;
  const rtc: Array<any> = [];
  const pagination: any = {};

  const query = {
    $or: [
      { sender: convoWith, recipient: currentUser },
      { sender: currentUser, recipient: convoWith },
    ],
  };

  const chats: Array<any> = await ChatSchema.find(query)
    .sort({ "meta.timestamp": "desc" })
    .limit(limit)
    .skip((page - 1) * limit);

  for (let i = 0; i < chats.length; i++) {
    let chat = chats[i];
    let msg: any = await retrieveChatMessage(chat.messageId);

    if (msg) {
      rtc.push({
        chatId: chat._id,
        type: chat.type,
        sender: chat.sender,
        recipient: chat.recipient,
        messageId: chat.messageId,
        text: msg.text,
        meta: chat.meta,
      });
    }
  }

  const totalEntries = (await ChatSchema.find(query, "_id")).length;
  const PAGE_LINK = `/chats/${convoWithUserEmail}?limit=${limit}&page=`;
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
  return await TextSchema.findOne({ messageId: messageId });
}

export default GetChatHistory;
