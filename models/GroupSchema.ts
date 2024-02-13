import mongoose from "mongoose";

let groupSchema = new mongoose.Schema({
  members: [String],
  admins: [String],
  owner: String,
  description: String,
  meta: {
    timestamp: String,
  },
});

export default mongoose.model("group", groupSchema);
