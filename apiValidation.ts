import Joi from "joi";
import AppException from "./AppException";
import { domainError } from "./domainError";

const createChannelSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
});

const addChannelMemberSchema = Joi.object({
  userEmail: Joi.string().required(),
});

export async function CreateChannel(requestData: any): Promise<any | void> {
  const { name, description } = requestData;
  try {
    return await createChannelSchema.validateAsync({ name, description });
  } catch (e) {
    const err: any = e;
    const message = err.message.replace(/\"/g, "");
    throw new AppException(domainError.INVALID_OR_MISSING_PARAMETER, message);
  }
}

export async function AddChannelMember(requestData: any): Promise<any | void> {
  const { userEmail } = requestData;
  try {
    return await addChannelMemberSchema.validateAsync({ userEmail });
  } catch (e) {
    const err: any = e;
    const message = err.message.replace(/\"/g, "");
    throw new AppException(domainError.INVALID_OR_MISSING_PARAMETER, message);
  }
}

export default {
  CreateChannel,
  AddChannelMember,
};
