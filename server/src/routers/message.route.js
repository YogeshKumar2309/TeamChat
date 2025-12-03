// import express from "express";
// import { getMessagesByChannel } from "../controllers/message.controller.js";

// const router = express.Router();

// // Get all messages of a channel
// router.get("/:channelId", async (req, res) => {
//   try {
//     const messages = await getMessagesByChannel(req.params.channelId);
//     res.json({ success: true, data: messages });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// export default router;


// ============================================
// routers/message.route.js
// ============================================
import express from "express";
import { getMessagesByChannel } from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.middleware.js"; // Your existing middleware

const router = express.Router();

// Get all messages of a channel
router.get("/:channelId", authenticate, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const messages = await getMessagesByChannel(req.params.channelId, {
      limit: parseInt(limit),
      before
    });
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;