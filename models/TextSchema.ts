import mongoose from "mongoose";

let textSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  text: { type: String, required: true },
});

export default mongoose.model("text", textSchema);
