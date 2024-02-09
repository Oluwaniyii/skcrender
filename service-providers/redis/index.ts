import config from "config";
import { createClient } from "redis";
import logger from "../../utils/logger";

export const client = createClient({
  url: config.get("redis.connection_string")
});

client.on("error", err => {
  logger.error("redis connection error", err);
  process.exit(1);
});

client.on("ready", () => {
  logger.debug("redis connection successful");
});

export async function connect() {
  await client.connect();
}
