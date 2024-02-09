import { Request, Response, NextFunction } from "express";
import boom from "@hapi/boom";
import logger from "./logger";

export const exitProcess = () => {
  process.exit(1);
};

export const notFoundErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  next(boom.notFound());
};

export const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
  logger.error({ reason, message: "Unhandled Rejection at Promise", promise });
  exitProcess();
};

export const uncaughtExceptionHandler = (err: any) => {
  logger.error(err);
  exitProcess();
};

export const errorDecorator = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Server error and stack trace is available - it is most likely a developer error
  const serverErrorWithStack = err.statusCode >= 500 && err.stack !== undefined;

  const nonBoomNoStatusCode = !err.isBoom && !err.statusCode;

  // Use original error message or otherwise Boom will set a default one
  const originalMessage = err.message || null;

  const options = {
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    decorate: {
      isDeveloperError: err.isDeveloperError || serverErrorWithStack || nonBoomNoStatusCode,
      originalUrl: req.originalUrl,
      method: req.method,
      ip: req.ip
    },
    data: { stack: err.stack || "n/a" }
  };

  // Decorate with additional properties from Boom
  boom.boomify(err, options);

  // Use original error message or otherwise Boom will set a default one
  if (originalMessage) err.output.payload.message = originalMessage; // eslint-disable-line
  err.output.payload.errorCode = err.errorCode;

  next(err);
};

export const finalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  // Log server errors only (no need to log 402, 403 etc.) and all developer/programmer errors
  if (err.isServer || err.isDeveloperError) {
    logger.error(err);
    exitProcess();
  } else {
    // Format error response
    const { statusCode, message, errorCode } = err.output.payload;
    const errorResponse: any = {};

    errorResponse.success = false;
    errorResponse.message = message;
    errorResponse.error = {};
    errorResponse.error.code = errorCode;
    errorResponse.error.message = message;
    errorResponse.error.status = statusCode;

    res.status(err.output.statusCode).json(errorResponse);
  }
};
