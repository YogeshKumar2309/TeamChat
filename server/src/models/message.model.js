// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//   {
//     channel: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Channel",
//       required: true,
//     },
//     sender: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     username: { type: String, required: true }, // sender username for quick access
//     message: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Message", messageSchema);
// ============================================
// models/message.model.js
// ============================================
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    username: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient pagination
messageSchema.index({ channel: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);