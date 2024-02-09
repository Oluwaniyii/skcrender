import { Request, Response, NextFunction } from "express";

const router = require("express").Router();

router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("Welcome to akitechat api");
});

router.get(
  "/error",
  function (req: Request, res: Response, next: NextFunction) {
    throw new Error("Server ran into an error");
  }
);

router.get("/pg/home", (req: Request, res: Response) => res.render("index"));

export default router;
