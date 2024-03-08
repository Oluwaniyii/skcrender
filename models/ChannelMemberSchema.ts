import mongoose from "mongoose";

let channelMember = new mongoose.Schema({
  class_id: String,
  member_uid: String,
  uid: String,
});

export default mongoose.model("class-members", channelMember);

// {"_id":{"$oid":"6578ddfdb9be180d8c466887"},
// "member_info":{"full_name":"Abdullahi Olajire",
// "paid":true,
// "avatar":"https://upload.wikimedia.org/wikipedia/commons/7/7c/User_font_awesome.svg"},
// "__v":{"$numberInt":"0"}}
