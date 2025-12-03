import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",    // User collection से लिंक
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date,
    default: Date.now 
  }
});

export default mongoose.model("Channel", channelSchema);
