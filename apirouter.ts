import { Request, Response, NextFunction } from "express";
import AppException from "./AppException";
import { domainError } from "./domainError";
import jwt from "./libraries/jwt";
import GetChatHistory from "./GetChatHistory";
import { createClassChannel, getChannelDetails } from "./actions/classChannel";
import { addChannelMember, removeChannelMember } from "./actions/channelMember";

const router = require("express").Router();

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("Welcome to SkiteChat API");
});

router.get(
  "/chats/:userid",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub } = res.locals.authenticatedUser;
      const { userid } = req.params;
      const { limit, page } = req.query;

      const action: any = await GetChatHistory(
        sub,
        userid,
        parseInt(`${limit}`) || 10,
        parseInt(`${page}`) || 1
      );

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "ok";
      const data: any = {};

      data["chats"] = action.chats;
      data["pagination"] = action.pagination;

      response.success = success;
      response.message = message;
      response.data = data;

      res.status(statusCode);
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/channels",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: owner } = res.locals.authenticatedUser;
      const { name, description } = req.body;

      const action: any = await createClassChannel(name, description, owner);

      const response: any = {};
      const statusCode = 201;
      const success = true;
      const message = "channel created successfully";
      const data: any = {};

      data["classChannel"] = action.channel;

      response.success = success;
      response.message = message;
      response.data = data;

      res.status(statusCode);
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/channels/:channelId",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const action: any = await getChannelDetails(channelId);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "ok";
      const data: any = {};

      data["classChannel"] = action.channel;

      response.success = success;
      response.message = message;
      response.data = data;

      res.status(statusCode);
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/channels/:channelId/members",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { userEmail } = req.body;

      const action = await addChannelMember(channelId, userEmail);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "member added";
      const data: any = {};

      data["channel"] = {};
      data["channel"]["id"] = action.channelId;
      data["channel"]["url"] = action.channelURL;

      data["member"] = {};
      data["member"]["total"] = action.membersCount;
      data["member"]["list"] = action.members;

      response.success = success;
      response.message = message;
      response.data = data;

      res.status(statusCode);
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  "/channels/:channelId/members/:memberEmail",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId, memberEmail } = req.params;

      const action = await removeChannelMember(channelId, memberEmail);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "member removed";
      const data: any = {};

      data["channel"] = {};
      data["channel"]["id"] = action.channelId;
      data["channel"]["url"] = action.channelURL;

      data["member"] = {};
      data["member"]["total"] = action.membersCount;
      data["member"]["list"] = action.members;

      response.success = success;
      response.message = message;
      response.data = data;

      res.status(statusCode);
      res.json(response);
    } catch (e) {
      next(e);
    }
  }
);

async function AuthProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let bearerToken =
      req.headers.authorization &&
      req.headers.authorization.split("Bearer ")[1];

    if (!bearerToken)
      throw new AppException(
        domainError.INVALID_OR_MISSING_HEADER,
        "missing bearer token"
      );

    const authenticatedUser: any = await jwt.decode(bearerToken);
    if (!authenticatedUser)
      throw new AppException(
        domainError.INVALID_BEARER_TOKEN,
        "invalid bearer token"
      );

    res.locals.authenticatedUser = authenticatedUser;
    next();
  } catch (err) {
    next(err);
  }
}

export default router;
