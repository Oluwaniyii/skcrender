import { Request, Response, NextFunction } from "express";
import AppException from "./AppException";
import { domainError } from "./domainError";
import jwt from "./libraries/jwt";
import GetChatHistory from "./GetChatHistory";

const router = require("express").Router();

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("Welcome to SkiteChat API");
});

router.get(
  "/chats/:userid",
  AuthProtectionMiddleware,
  async function (req: Request, res: Response, next: NextFunction) {
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
