import { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import winston from "./winston";

export const stderrStream = (req: Request, res: Response, next: NextFunction) => {
  morgan("combined", {
    skip: function(req, res) {
      return res.statusCode < 400;
    },
    stream: {
      write: (message: any) => {
        winston.info(message);
      }
    }
  });
  next();
};

export const stdoutStream = (req: Request, res: Response, next: NextFunction) => {
  morgan("combined", {
    skip: function(req, res) {
      return res.statusCode >= 400;
    },
    stream: {
      write: (message: any) => {
        winston.error(message);
      }
    }
  });
  next();
};
