import mongoose from "mongoose";

const usersModel = new mongoose.Schema({
  firstName: { type: String, required: [true, "Please provide firstname"] },
  lastName: { type: String, required: [true, "Please provide lastname"] },
  sso: { type: String },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    unique: true,
  },
  password: { type: String },
  otp: { type: String },
  lastOtpUpdate: { type: Date },
  uploadedDoc: { type: Boolean, default: false },
  avatar: {
    type: String,
    default:
      "https://res.cloudinary.com/appuistore/image/upload/v1703176069/Trainer/zwhn0lsqxdznvdgftlbb.png",
  },
  deviceId: { type: String },
  phoneToken: { type: String },
  refCode: { type: String },
  referedBy: { type: String },
  verified: { type: Boolean },
  gender: { type: String },
  city: { type: String },
  country: { type: String },
  online_status: { type: String, default: "Offline" },
  awareness: { type: String },
  ownedClass: { type: Boolean, default: false },
  description: { type: String },
  paid_classes: { type: Array },
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
    },
  ],
});

export default mongoose.model("User", usersModel);
