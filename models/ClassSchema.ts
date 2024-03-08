import mongoose from "mongoose";
import User from "./Usermodel";
const myObjectId = mongoose.Types.ObjectId;

const classesModel = new mongoose.Schema({
  class_name: { type: String, required: [true, "Please provide Class Name"] },
  short_description: {
    type: String,
    required: [true, "Please provide Short Description"],
  },
  full_description: {
    type: String,
    required: [true, "Please provide Short Description"],
  },
  category: {
    type: String,
    required: [true, "Please provide Category"],
  },
  category_id: {
    type: String,
    required: [true, "Please provide Category ID"],
  },
  total_members: {
    type: Number,
    default: 0,
    integer: true,
  },
  price: { type: String, required: [true, "Please provide Price"] },
  discount: { type: String, required: [true, "Please provide discount"] },
  reviews: { type: Object },
  creator: { type: String },
  instructors: {
    type: Array,
  },
  duration: { type: String },
  language: { type: String, default: "English" },
  start_date: { type: String },
  end_date: { type: String },
  start_time: { type: String },
  end_time: { type: String },
  timezone: { type: String },
  year: { type: String },
  currency: { type: String },
  class_chats: { type: Array },
  banner: { type: String },
  class_short_uid: { type: String },
  installment: { type: Boolean, default: false },
  class_day_range: { type: String },
  installment_plan: { type: Object },
});

const membersModel = new mongoose.Schema({
  class_id: {
    type: String,
  },
  member_uid: {
    type: String,
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export default mongoose.model("Classes", classesModel);
