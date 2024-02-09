import mongoose from "mongoose";
import winston from "../utils/logger/winston";

const dbURI: string = process.env.DB_URI || "";
let db: any;

function dbConnect() {
  mongoose.connect(dbURI);
  db = mongoose.connection;

  db.on("error", onError);
  db.on("connected", onConnected);
  db.on("reconnected", onReconnected);

  process.on("SIGINT", onSIGINT);
  process.on("SIGTERM", onSIGINT);
}

function onConnected() {
  winston.log("debug", "Connected to MongoDB Atlas!");
}

function onReconnected() {
  winston.warn("MongoDB Atlas reconnected!");
}

function onError(err: any) {
  winston.error(`MongoDB Atlas connection error: ${err}`);
}

function onSIGINT() {
  db.close(() => {
    winston.warn(
      "MongoDB Atlas default connection disconnected through app termination!"
    );
    process.exit();
  });
}

export default dbConnect;
