import mongoose from "mongoose";

let bookmarkSchema = new mongoose.Schema({
  user_id: String,
  bookmarks: [String],
});

export default mongoose.model("skc_bookmark", bookmarkSchema);
