import { v4 as uuidv4 } from "uuid";

class UUID {
  public static generate() {
    return uuidv4();
  }
}

export default UUID;
