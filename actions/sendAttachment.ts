import MessageSchema from "../models/MessageSchema";
import ChatSchema from "../models/ChatSchema";
import MediaSchema from "../models/MediaSchema";
import ClassChannelSchema from "../models/ClassChannelSchema";
import { v2 as cloudinary } from "cloudinary";
import logger from "../utils/logger";
import ClassSchema from "../models/ClassSchema";
import ClassMembersSchema from "../models/ClassMembersSchema";
import Usermodel from "../models/Usermodel";
import CommunitySchema from "../models/CommunitySchema";

import { clients, clientsUsers, clientsUsersId } from "../clientManager";
import { Push } from "../Notification";

type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

async function sendFile(payload: any, client: client) {
  try {
    const messageGroup = payload.to;
    if (messageGroup === "individual") await sendToIndividual(payload, client);
    else if (messageGroup === "group") await sendToGroup(payload, client);
    else if (messageGroup === "community")
      await sendToCommunity(payload, client);
    else {
    }
  } catch (e) {
    client.socket.send(
      JSON.stringify({
        eventName: "dis::sendAttachment",
        payload: {
          message: "message send failed",
          chatId: payload.chatId,
        },
      })
    );
    console.log(e);
    logger.error(e);
  }
}

async function sendToIndividual(payload: any, client: client) {
  const { socketId, user, socket } = client;
  const userId = user.id;
  const { to, recipient, type, chatId, binary, meta } = payload;

  const mex: string[] = meta.type ? meta.type.split("/") : [];
  let cex: any = meta.name && meta.name.split(".");
  cex = cex[cex.length - 1];

  //upload to cloudinary
  const result: any = await cloudinary.uploader.upload(binary, {
    resource_type: "auto",
    overwrite: false,
    use_filename: true,
    unique_filename: true,
    filename_override: meta.name,
  });
  const { asset_id, public_id, secure_url, format, resource_type } = result;

  // Store
  const message: any = new MessageSchema({ type: "media" });
  const media: any = new MediaSchema({
    messageId: message._id,
    mediaType: mex[0],
    mediaExtension: cex,
    name: meta.name,
    url: secure_url,
    size: meta.size,
    assetId: asset_id,
    publicId: public_id,
  });
  const chat: any = new ChatSchema({
    type: "media",
    to: to,
    sender: userId,
    recipient: recipient,
    messageId: message._id,
    cId: chatId,
    meta: {
      timestamp: new Date(),
      isRead: false,
    },
    createdAt: performance.now(),
  });

  await message.save();
  await media.save();
  await chat.save();

  // raise acknowledge message event to the sender
  client.socket.send(
    JSON.stringify({
      eventName: "ack::sendAttachment",
      payload: {
        message: "attachment Sent",
        to: to,
        recipient: recipient,
        type: type,
        chatId: chat.cId,
        messageId: message._id,
        mediaUrl: secure_url,
        meta: {
          timestamp: chat.meta.timestamp,
        },
      },
    })
  );

  // prepare payload
  const senderInfo: any = await Usermodel.findById(
    user.uid,
    "firstName lastName email avatar"
  );

  const receiveMediaPayload = {
    from: to,
    type: type,
    sender: userId,
    recipient: recipient,
    name: meta.name,
    size: meta.size,
    mediaType: mex[0],
    mediaExtension: cex,
    url: secure_url,
    chatId: chat.cId,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // raise receiveMessage event to the recipient if online
  if (clientsUsers[recipient]) {
    const recipientClient = clients[clientsUsers[recipient]];
    const recipientSocket = recipientClient.socket;

    recipientSocket.send(
      JSON.stringify({
        eventName: "se::receiveAttachment",
        payload: receiveMediaPayload,
      })
    );

    await push(recipientClient.user.id, {
      from: senderInfo.email,
      body: "attachment",
      icon: senderInfo.avatar,
    });
  }
}

async function sendToGroup(payload: any, client: client) {
  const { socketId, user, socket } = client;
  const userId = user.uid;
  const { to, recipient, type, chatId, binary, meta } = payload;

  const mex: string[] = meta.type ? meta.type.split("/") : [];
  let cex: any = meta.name && meta.name.split(".");
  cex = cex[cex.length - 1];

  // Group has to exist
  // You have to be a member of the group
  const group: any = await ClassSchema.findById(recipient, "_id creator");
  if (!group)
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendAttachment",
        payload: {
          message: `channel ${recipient} does not exist send failed`,
          chatId: chatId,
        },
      })
    );

  const members = await ClassMembersSchema.find(
    { class_id: recipient },
    "class_id member_uid"
  );
  let membersIds: any[] = [group.creator];
  members.forEach((member) => membersIds.push(member.member_uid));

  if (!membersIds.includes(userId))
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendAttachment",
        payload: {
          message: `you can't send or receive messages on group ${recipient} because you are not a member`,
          chatId: chatId,
        },
      })
    );

  //upload to cloudinary
  const result: any = await cloudinary.uploader.upload(binary, {
    resource_type: "auto",
    unique_filename: true,
    overwrite: true,
    filename_override: meta.name,
  });
  const { asset_id, public_id, secure_url, format, resource_type } = result;

  // Store
  const message: any = new MessageSchema({ type: "media" });
  const media: any = new MediaSchema({
    messageId: message._id,
    mediaType: mex[0],
    mediaExtension: cex,
    name: meta.name,
    url: secure_url,
    size: meta.size,
    assetId: asset_id,
    publicId: public_id,
  });
  const chat: any = new ChatSchema({
    type: "media",
    to: to,
    sender: userId,
    recipient: recipient,
    messageId: message._id,
    cId: chatId,
    meta: {
      timestamp: new Date(),
      isRead: false,
    },
    createdAt: performance.now(),
  });

  await message.save();
  await media.save();
  await chat.save();

  // raise acknowledge message event to the sender
  client.socket.send(
    JSON.stringify({
      eventName: "ack::sendAttachment",
      payload: {
        message: "attachment Sent",
        to: to,
        recipient: recipient,
        type: type,
        chatId: chat.cId,
        messageId: message._id,
        mediaUrl: secure_url,
        meta: {
          timestamp: chat.meta.timestamp,
        },
      },
    })
  );

  const senderInfo: any = await Usermodel.findById(
    userId,
    "firstName lastName email avatar"
  );

  // prepare payload
  const receiveMediaPayload = {
    type: type,
    from: to,
    sender: userId,
    senderInfo: {
      name: `${senderInfo?.firstName} ${senderInfo?.lastName}`,
      avatar: senderInfo?.avatar,
    },
    recipient: recipient,
    name: meta.name,
    size: meta.size,
    mediaType: mex[0],
    mediaExtension: cex,
    url: secure_url,
    chatId: chat.cId,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // populate message to all active members excluding owner
  // filter group active members
  const activeMembers = membersIds.filter(function (member: any) {
    return member !== userId && !!clientsUsersId[member];
  });

  // send message to all active members
  activeMembers.forEach(async (member: any) => {
    const recipientClient = clients[clientsUsersId[member]];
    const recipientSocket = recipientClient.socket;

    recipientSocket.send(
      JSON.stringify({
        eventName: "se::receiveAttachment",
        payload: receiveMediaPayload,
      })
    );

    await push(recipientClient.user.id, {
      from: senderInfo.email,
      body: "attachment",
      icon: senderInfo.avatar,
    });
  });
}

async function sendToCommunity(payload: any, client: client) {
  const { socketId, user, socket } = client;
  const userId = user.uid;
  const { to, recipient, type, chatId, binary, meta } = payload;

  const mex: string[] = meta.type ? meta.type.split("/") : [];
  let cex: any = meta.name && meta.name.split(".");
  cex = cex[cex.length - 1];

  // Group has to exist
  // You have to be a member of the group
  const group: any = await CommunitySchema.findById(recipient);
  if (!group)
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendAttachment",
        payload: {
          message: `channel ${recipient} does not exist send failed`,
          chatId: chatId,
        },
      })
    );

  const members: any = group.members;
  // let membersIds: any[] = [group.creator];
  let membersIds: any[] = [];
  members.forEach((member: any) => membersIds.push(member.userId));

  if (!membersIds.includes(userId))
    return client.socket.send(
      JSON.stringify({
        eventName: "dis::sendAttachment",
        payload: {
          message: `you can't send or receive messages on group ${recipient} because you are not a member`,
          chatId: chatId,
        },
      })
    );

  //upload to cloudinary
  const result: any = await cloudinary.uploader.upload(binary, {
    resource_type: "auto",
    unique_filename: true,
    overwrite: true,
    filename_override: meta.name,
  });
  const { asset_id, public_id, secure_url, format, resource_type } = result;

  // Store
  const message: any = new MessageSchema({ type: "media" });
  const media: any = new MediaSchema({
    messageId: message._id,
    mediaType: mex[0],
    mediaExtension: cex,
    name: meta.name,
    url: secure_url,
    size: meta.size,
    assetId: asset_id,
    publicId: public_id,
  });
  const chat: any = new ChatSchema({
    type: "media",
    to: to,
    sender: userId,
    recipient: recipient,
    messageId: message._id,
    cId: chatId,
    meta: {
      timestamp: new Date(),
      isRead: false,
    },
    createdAt: performance.now(),
  });

  await message.save();
  await media.save();
  await chat.save();

  // raise acknowledge message event to the sender
  client.socket.send(
    JSON.stringify({
      eventName: "ack::sendAttachment",
      payload: {
        message: "attachment Sent",
        to: to,
        recipient: recipient,
        type: type,
        chatId: chat.cId,
        messageId: message._id,
        mediaUrl: secure_url,
        meta: {
          timestamp: chat.meta.timestamp,
        },
      },
    })
  );

  const senderInfo: any = await Usermodel.findById(
    userId,
    "firstName lastName avatar"
  );

  // prepare payload
  const receiveMediaPayload = {
    type: type,
    from: to,
    sender: userId,
    senderInfo: {
      name: `${senderInfo?.firstName} ${senderInfo?.lastName}`,
      avatar: senderInfo?.avatar,
    },
    recipient: recipient,
    name: meta.name,
    size: meta.size,
    mediaType: mex[0],
    mediaExtension: cex,
    url: secure_url,
    chatId: chat.cId,
    messageId: message._id,
    meta: {
      timestamp: chat.meta.timestamp,
    },
  };

  // populate message to all active members excluding owner
  // filter group active members
  const activeMembers = membersIds.filter(function (member: any) {
    return member !== userId && !!clientsUsersId[member];
  });

  // send message to all active members
  activeMembers.forEach(async (member: any) => {
    const recipientClient = clients[clientsUsersId[member]];
    const recipientSocket = recipientClient.socket;

    recipientSocket.send(
      JSON.stringify({
        eventName: "se::receiveAttachment",
        payload: receiveMediaPayload,
      })
    );

    await push(recipientClient.user.id, {
      from: senderInfo.email,
      body: "attachment",
      icon: senderInfo.avatar,
    });
  });
}

async function push(
  to: string,
  data: {
    from: string;
    body: string;
    icon: string;
  }
) {
  console.log("calling push message");
  await Push(to, data);
}

export default sendFile;
