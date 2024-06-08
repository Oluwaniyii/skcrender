import mongoose from "mongoose";
import myObjectId = mongoose.Types.ObjectId;

const communityModel = new mongoose.Schema({
  name: { type: String, required: [true, "Please provide community Name"] },
  description: {
    type: String,
    required: [true, "Please provide Description"],
  },
  creator: { type: String },
  banner: { type: String },
  total_members: {
    type: Number,
    default: 0,
    integer: true,
  },
  members: [
    {
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      userId: String,
      avatar: String,
    },
  ],
});

export default mongoose.model("Community", communityModel);
