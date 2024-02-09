import { Request, Response, NextFunction } from "express";
const boom = require("@hapi/boom");

/**
 * Wrapper for our async route handlers
 * @param {*} fn
 */
const asyncMiddleware = function(fn: any) {
  return function(req: Request, res: Response, next: NextFunction) {
    return Promise.resolve(fn(req, res, next)).catch(err => {
      if (!err.isBoom) return next(boom.badImplementation(err));
      next(err);
    });
  };
};

export default asyncMiddleware;
