import Usermodel from "../models/Usermodel";
import AppException from "../AppException";
import { domainError } from "../domainError";
import ChatSchema from "../models/ChatSchema";
import ClassSchema from "../models/ClassSchema";
import ClassMembersSchema from "../models/ClassMembersSchema";
import BookmarkSchema from "../models/BookmarkSchema";
import TextSchema from "../models/TextSchema";
import MediaSchema from "../models/MediaSchema";
import MessageSchema from "../models/MessageSchema";
import CommunitySchema from "../models/CommunitySchema";

export async function addBookmark(userEmail: string, chatId: string) {
  const user = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);
  const userId = user._id.toString();

  const chat: any = await ChatSchema.findOne(
    { cId: chatId },
    "cId to sender recipient"
  );

  if (!chat)
    throw new AppException(
      domainError.NOT_FOUND,
      `chat ${chatId} does not exist`
    );

  if (chat.to === "individual") {
    if (userEmail !== chat.sender && userEmail !== chat.recipient)
      throw new AppException(
        domainError.NOT_FOUND,
        `you cannot bookmark this chat because you don't have access`
      );
  }

  if (chat.to === "group") {
    const group: any = await ClassSchema.findById(
      chat.recipient,
      "_id creator"
    );

    if (!group)
      throw new AppException(
        domainError.NOT_FOUND,
        `you cannot bookmark this chat because group no longer exist`
      );

    const member = await ClassMembersSchema.findOne({
      class_id: chat.recipient,
      member_uid: userId,
    });

    if (!member)
      throw new AppException(
        domainError.NOT_FOUND,
        `you cannot bookmark this chat because you are not a member of the group`
      );
  }

  if (chat.to === "community") {
    const group: any = await CommunitySchema.findById(chat.recipient);

    if (!group)
      throw new AppException(
        domainError.NOT_FOUND,
        `you cannot bookmark this chat because community no longer exist`
      );

    const member = group.members.find(
      (member: any) => member.userId === userId
    );

    if (!member)
      throw new AppException(
        domainError.NOT_FOUND,
        `you cannot bookmark this chat because you are not a member of the community`
      );
  }

  let bookmark = await BookmarkSchema.findOne({ user_id: userId });
  if (bookmark) {
    if (!bookmark.bookmarks.includes(chatId)) {
      bookmark.bookmarks.push(chatId);
      await bookmark.save();
    }
  } else {
    bookmark = new BookmarkSchema({
      user_id: userId,
      bookmarks: [chatId],
    });
    await bookmark.save();
  }

  return bookmark.bookmarks;
}

export async function removeBookmark(userEmail: string, chatId: string) {
  const user: any = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);
  const userId = user._id.toString();

  let bookmark: any = await BookmarkSchema.findOne({ user_id: userId });
  if (bookmark) {
    if (bookmark.bookmarks.includes(chatId)) {
      bookmark.bookmarks = bookmark.bookmarks.filter(
        (bookmarkId: string) => bookmarkId !== chatId
      );
      await bookmark.save();
    }

    return bookmark.bookmarks;
  } else {
    return [];
  }
}

export async function getBookmarks(userEmail: string) {
  const user = await Usermodel.findOne({ email: userEmail }, "_id");
  if (!user)
    throw new AppException(domainError.NOT_FOUND, `something went wrong`);
  const userId = user._id.toString();

  let bookmarksCount: number = 0;
  let chats: any[] = [];
  let rtc: any[] = [];

  const bookmark: any = await BookmarkSchema.findOne({ user_id: userId });
  if (!bookmark) return { chats: rtc, bookmarksCount: bookmarksCount };

  bookmarksCount = bookmark.bookmarks.length;

  for (let i = 0; i < bookmark.bookmarks.length; i++) {
    const bookmarkId = bookmark.bookmarks[i];
    const chat = await ChatSchema.findOne({ cId: bookmarkId });
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

  return { chats: rtc, bookmarksCount: bookmarksCount };
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
