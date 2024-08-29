import config from "config";
import { createClient } from "redis";
import logger from "../../utils/logger";

export let client = createClient({
  url: config.get("redis.connection_string"),
  pingInterval: 3000,
});

client.on("error", (err) => {
  logger.error("redis connection error", err);
});

client.on("ready", () => {
  logger.debug("redis connection successful");
});

export async function connect() {
  await client.connect();
}
