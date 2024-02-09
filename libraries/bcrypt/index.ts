import bcrypt from "bcryptjs";

class Bcrypt {
  public static async compare(value1: string, value2: string): Promise<boolean> {
    return bcrypt.compare(value1, value2);
  }

  public static async hash(value: string, saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(value, saltRounds);
  }
}

export default Bcrypt;
