import { Request, Response, NextFunction } from "express";
import AppException from "./AppException";
import { domainError } from "./domainError";
import jwt from "./libraries/jwt";
import { GetChatHistory, GetChatConvo } from "./GetChatHistory";
import { createClassChannel, getChannelDetails } from "./actions/classChannel";
import { addChannelMember, removeChannelMember } from "./actions/channelMember";
import { addBookmark, getBookmarks, removeBookmark } from "./actions/bookmark";
import { addPin, getPins } from "./actions/pin";
import apiValidation from "./apiValidation";
import Redis from "./libraries/redis";

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
        parseInt(`${limit}`) || 15,
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

router.get(
  "/chats/:userid/:chatid",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub } = res.locals.authenticatedUser;
      const { userid, chatid } = req.params;
      const { limit, page } = req.query;

      const action: any = await GetChatConvo(
        sub,
        userid,
        chatid,
        parseInt(`${limit}`) || 15,
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

router.get(
  "/bookmarks",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userEmail } = res.locals.authenticatedUser;
      const action: any = await getBookmarks(userEmail);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "ok";
      const data: any = {};

      data["bookmarks"] = action.chats;
      data["bookmarksCount"] = action.bookmarksCount;

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
  "/bookmarks",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userEmail } = res.locals.authenticatedUser;
      const { chatId } = await apiValidation.AddBookmark(req.body);

      const action: any = await addBookmark(userEmail, chatId);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "bookmark added";
      const data: any = {};

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
  "/bookmarks",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userEmail } = res.locals.authenticatedUser;
      const { chatId } = await apiValidation.AddBookmark(req.body);

      const action: any = await removeBookmark(userEmail, chatId);
      console.log(action);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "bookmark removed";
      const data: any = {};

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
  "/class/:classId/pins",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userEmail } = res.locals.authenticatedUser;
      const { classId } = req.params;

      const action: any = await getPins(userEmail, classId);

      const response: any = {};
      const statusCode = 200;
      const success = true;
      const message = "ok";
      const data: any = {};

      data["pins"] = action.chats;
      data["pinsCount"] = action.pinsCount;

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

/*
router.post(
  "/system/pn/subscribe",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    const subscription = req.body;
    const { sub: userEmail } = res.locals.authenticatedUser;

    let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
    userSubscriptions = userSubscriptions ? JSON.parse(userSubscriptions) : [];
    userSubscriptions.push(subscription);

    await Redis.setWithExpiry(
      `pnsub_${userEmail}`,
      JSON.stringify(userSubscriptions),
      259200000 // 3days
    );

    res.status(201).json({ message: "subscription added" });
  }
);
*/

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

/*
router.post(
  "/channels",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: owner } = res.locals.authenticatedUser;
      const { name, description } = await apiValidation.CreateChannel(req.body);

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


router.post(
  "/channels/:channelId/members",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { userEmail } = await apiValidation.AddChannelMember(req.body);

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
router.delete(
  "/channels/:channelId/members/:memberEmail",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId, memberEmail } = req.params;
      const { sub: authenticatedUser } = res.locals.authenticatedUser;

      const action = await removeChannelMember(
        channelId,
        memberEmail,
        authenticatedUser
      );

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
*/

export default router;
