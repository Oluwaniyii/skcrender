import config from "config";
import appRoot from "app-root-path";
import { createLogger, transports, format } from "winston";

const { combine, prettyPrint } = format;

const appConfig: any = config.get("app");
const logToFile: boolean = appConfig["logging"]["file"];

const options = {
  file: logToFile
    ? {
        level: "info",
        filename: `${appRoot}/logs/app.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
      }
    : null,
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true
  }
};

const logger = createLogger({
  format: combine(
    format.timestamp({
      format: "YYYY-MM-DD hh:mm:ss"
    }),
    prettyPrint()
  ),
  transports: [
    ...(options.file ? [new transports.File(options.file)] : []),
    new transports.Console(options.console)
  ],
  exitOnError: false
});

export default logger;
