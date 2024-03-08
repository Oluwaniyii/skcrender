import mongoose from "mongoose";

const membersModel = new mongoose.Schema({
  class_id: {
    type: String,
  },
  future_payment: {
    type: Object,
  },
  chat_expired: {
    type: String,
  },
  partially: { type: Boolean },
  all_instalment_paid: { type: Boolean, default: false },
  member_uid: {
    type: String,
  },
  member_info: {
    type: Object,
  },
});

export default mongoose.model("Class-Members", membersModel);
