import mongoose from "mongoose";

let chatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  to: { type: String, required: true },
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  messageId: { type: String, required: true },
  cId: { type: String, required: true },
  meta: {
    timestamp: { type: Date },
    isRead: { type: Boolean, default: false },
  },
  createdAt: { type: Number },
});

export default mongoose.model("skc_chat", chatSchema);
