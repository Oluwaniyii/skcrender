import mongoose from "mongoose";

let messageSchema = new mongoose.Schema({
  type: String, // text | media
});

export default mongoose.model("skc_message", messageSchema);
