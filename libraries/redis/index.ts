import { client } from "../../service-providers/redis";

class Redis {
  public static async setWithExpiry(
    key: string,
    data: any,
    expiry: number
  ): Promise<void> {
    await client.setEx(key, expiry, JSON.stringify(data));
  }

  public static async getKey(key: string): Promise<any> {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }
}

export default Redis;
