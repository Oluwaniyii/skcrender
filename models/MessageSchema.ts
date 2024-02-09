import mongoose from "mongoose";

let messageSchema = new mongoose.Schema({
  type: String,
  text: String,
  mediaType: String,
  url: String,
});

export default mongoose.model("blog", messageSchema);
