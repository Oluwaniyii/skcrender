import mongoose from "mongoose";

let pinSchema = new mongoose.Schema({
  class_id: String,
  pins: [String],
});

export default mongoose.model("skc_pin", pinSchema);
