// import Message from "../models/message.model.js";

// export const saveMessage = async (data) => {
//   // data: { channel, sender, username, message }
//   try {
//     const newMessage = await Message.create(data);
//     return newMessage;
//   } catch (err) {
//     console.error(err);
//     throw new Error("Failed to save message");
//   }
// };

// export const getMessagesByChannel = async (channelId) => {
//   return await Message.find({ channel: channelId }).sort({ createdAt: 1 });
// };


// ============================================
// controllers/message.controller.js
// ============================================
// ============================================
// controllers/message.controller.js
// ============================================
import Message from "../models/message.model.js";

export const saveMessage = async (data) => {
  try {
    const newMessage = await Message.create(data);
    return newMessage;
  } catch (err) {
    console.error("Error saving message:", err);
    throw new Error("Failed to save message");
  }
};

export const getMessagesByChannel = async (channelId, options = {}) => {
  try {
    const { limit = 50, before } = options;
    
    let query = { channel: channelId };
    
    // Pagination: get messages before a certain timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Latest first for query
      .limit(limit)
      .lean();
    
    // Reverse to show oldest first in chat
    return messages.reverse();
  } catch (err) {
    console.error("Error fetching messages:", err);
    throw new Error("Failed to fetch messages");
  }
};