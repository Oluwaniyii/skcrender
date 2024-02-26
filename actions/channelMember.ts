import ClassChannelSchema from "../models/ClassChannelSchema";
import UserSchema from "../models/Usermodel";
import AppException from "../AppException";
import { domainError } from "../domainError";

export async function addChannelMember(channelId: string, userEmail: string) {
  const channel = await ClassChannelSchema.findById(channelId, "_id members");
  if (!channel)
    throw new AppException(
      domainError.NOT_FOUND,
      `channel ${channelId} does not exist`
    );

  const user = await UserSchema.findOne({ email: userEmail }, "_id email");
  if (!user)
    throw new AppException(
      domainError.NOT_FOUND,
      `user with email ${userEmail} does not exist`
    );

  const { members } = channel;
  if (!members.includes(userEmail)) members.push(userEmail);

  await ClassChannelSchema.findByIdAndUpdate(channelId, {
    members: members,
  });

  return {
    channelId: channelId,
    channelURL: `/channels/${channel._id}`,
    membersCount: members.length,
    members: members,
  };
}

export async function removeChannelMember(
  channelId: string,
  userEmail: string
) {
  const channel = await ClassChannelSchema.findById(
    channelId,
    "_id owner members"
  );

  if (!channel)
    throw new AppException(
      domainError.NOT_FOUND,
      `channel ${channelId} does not exist`
    );

  const { _id: groupId, members, owner } = channel;

  if (userEmail === owner)
    throw new AppException(
      domainError.NOT_FOUND,
      `you cannot remove group creator`
    );

  if (!members.includes(userEmail))
    throw new AppException(
      domainError.NOT_FOUND,
      `${userEmail} in not a member of group ${groupId}`
    );

  let newMembers: string[] = members.filter(function (member) {
    return member !== userEmail;
  });

  await ClassChannelSchema.findByIdAndUpdate(channelId, {
    members: newMembers,
  });

  return {
    channelId: channelId,
    channelURL: `/channels/${channel._id}`,
    membersCount: newMembers.length,
    members: newMembers,
  };
}
