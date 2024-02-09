import jwt from "jsonwebtoken";
import logger from "../../utils/logger";
import config from "config";

class JWT {
  private static JWT_SECRET: string = config.get("jwt.secret");

  public static async sign(payload: any) {
    try {
      return jwt.sign(payload, JWT.JWT_SECRET);
    } catch (error) {
      throw error;
    }
  }

  public static async decode(token: string) {
    let decoded;

    try {
      decoded = jwt.verify(token, JWT.JWT_SECRET);
    } catch (e) {
      const error: any = e;

      if (error.message && error.message === "invalid signature")
        logger.error(error);
      decoded = null;
    }

    return decoded;
  }
}

export default JWT;
