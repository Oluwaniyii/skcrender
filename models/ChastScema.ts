import mongoose from "mongoose";

let chatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  messageId: { type: String, required: true },
  meta: {
    timeStamp: { type: String, required: true },
  },
});

export default mongoose.model("blog", chatSchema);
