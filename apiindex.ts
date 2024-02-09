import config from "config";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import cors from "cors";
import router from "./apirouter";
import dotenv from "dotenv";
import { stderrStream, stdoutStream } from "./utils/logger/morgan";
import db from "./db";
import {
  errorDecorator,
  finalErrorHandler,
  notFoundErrorHandler,
  unhandledRejectionHandler,
  uncaughtExceptionHandler,
} from "./utils/errorMiddleware";
import { connect as redisConnect } from "./service-providers/redis";

dotenv.config();

const app: Express = express();

const PORT = process.env.PORT;
const HOST = process.env.HOST || "localhost";
const CORS_OPTIONS = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.set("env", process.env.NODE_ENV);
// app.set("host", config.get("app.host"));
app.set("port", config.get("app.port"));
app.set("view engine", "ejs");

// Middlewares
app.use(stderrStream, stdoutStream);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(CORS_OPTIONS));

app.use(router);

// Error handling
process.on("unhandledRejection", unhandledRejectionHandler);
process.on("uncaughtException", uncaughtExceptionHandler);
process.on("SIGTERM", () => process.exit(0));

app.use(notFoundErrorHandler);
app.use(errorDecorator);
app.use(finalErrorHandler);

db();
redisConnect();

app.listen(PORT, () => console.log(`server started on http://${HOST}:${PORT}`));
