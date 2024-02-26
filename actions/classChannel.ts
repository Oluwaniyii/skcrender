import ClassChannelSchema from "../models/ClassChannelSchema";
import AppException from "../AppException";
import { domainError } from "../domainError";

export async function createClassChannel(
  channelName: string,
  channelDescription: string,
  channelOwner: string
) {
  const classChannel: any = new ClassChannelSchema({
    name: channelName,
    description: channelDescription,
    owner: channelOwner,
    admins: [channelOwner],
    members: [channelOwner],
    meta: {
      timestamp: new Date().toISOString(),
    },
  });

  await classChannel.save();

  const {
    _id: channelId,
    name,
    owner,
    admins,
    members,
    description,
    avatar,
    meta,
  } = classChannel;

  return {
    channel: {
      channelId,
      name,
      avatar,
      description,
      owner,
      membersCount: members.length,
      members,
      admins,
      createdAt: meta.timestamp,
    },
  };
}

export async function getChannelDetails(channelId: string) {
  const classChannel: any = await ClassChannelSchema.findById(channelId);
  if (!classChannel)
    throw new AppException(
      domainError.NOT_FOUND,
      `channel ${channelId} does not exist`
    );

  const { _id, name, owner, admins, members, description, avatar, meta } =
    classChannel;

  return {
    channel: {
      channelId: _id,
      name,
      avatar,
      description,
      owner,
      membersCount: members.length,
      members,
      admins,
      createdAt: meta.timestamp,
    },
  };
}
