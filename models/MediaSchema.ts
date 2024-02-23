import mongoose from "mongoose";

let mediaSchema = new mongoose.Schema({
  id: String,
  messageId: String,
  mediaType: String,
  url: String,
  size: Number,
  text: String,
});

export default mongoose.model("skc_media", mediaSchema);
