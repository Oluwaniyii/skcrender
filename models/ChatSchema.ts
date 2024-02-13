import mongoose from "mongoose";

let chatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  to: { type: String, required: true },
  sender: { type: String, required: true },
  recipient: { type: String, required: true },
  messageId: { type: String, required: true },
  meta: {
    timestamp: {
      type: String,
      default: new Date().toISOString(),
    },
    isRead: { type: Boolean, default: false },
  },
});

export default mongoose.model("chat", chatSchema);

/*
  { type: 'text', _id: new ObjectId('65ca9ec9f1e9d57b9e29ff26'), __v: 0 } 
  {
    messageId: '65ca9ec9f1e9d57b9e29ff26',
    text: 'Holla Dora\n        ',
    _id: new ObjectId('65ca9ec9f1e9d57b9e29ff27'),
    __v: 0
  } 
  {
    type: 'text',
    from: '1c73fb08-e898-4918-932b-d2c1cf0f8919',
    to: 'individual',
    messageId: '65ca9ec9f1e9d57b9e29ff26',
    meta: { timeStamp: '2024-02-12T22:41:58.700Z', isRead: false },
    _id: new ObjectId('65ca9ec9f1e9d57b9e29ff28'),
    __v: 0
  }
*/
