import mongoose from "mongoose";

let classChannelSchema = new mongoose.Schema({
  name: String,
  owner: String,
  members: [String],
  admins: [String],
  avatar: String,
  description: String,
  meta: {
    timestamp: String,
  },
});

export default mongoose.model("skc_class_channel", classChannelSchema);
