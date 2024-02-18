import { config } from "dotenv";
config();

export default {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
    baseURL: `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`,
    logging: {
      file: true,
    },
  },
  ws: {
    host: process.env.WS_HOST,
    port: process.env.WS_PORT,
    base: process.env.WS_BASE,
  },
  db: {
    mysql: {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    },
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "sercrett",
  },
  redis: {
    connection_string: process.env.REDIS_CONNECTION_STRING,
  },
  mail: {
    transport: {
      host: process.env.MAIL_TRANSPORT_HOST,
      port: process.env.MAIL_TRANSPORT_PORT,
      auth: {
        user: process.env.MAIL_TRANSPORT_USER,
        password: process.env.MAIL_TRANSPORT_PASSWORD,
      },
    },
    address: {
      receiver: process.env.MAIL_ADDRESS_TEST_RECEIVER_MAIL,
    },
  },
};
