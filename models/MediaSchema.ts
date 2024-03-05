import mongoose from "mongoose";

let mediaSchema = new mongoose.Schema({
  messageId: String,
  mediaType: String,
  mediaExtension: String,
  name: String,
  url: String,
  size: Number,
  text: String,
  assetId: String,
  publicId: String,
});

export default mongoose.model("skc_media", mediaSchema);
