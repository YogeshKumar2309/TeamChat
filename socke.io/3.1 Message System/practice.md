# Message System - Complete Implementation

## Project Structure

```
message-system/
├── backend/
│   ├── models/
│   │   └── Message.js
│   ├── routes/
│   │   └── messages.js
│   ├── controllers/
│   │   └── messageController.js
│   ├── config/
│   │   └── database.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatRoom.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── MessageItem.jsx
│   │   ├── utils/
│   │   │   └── dateFormatter.js
│   │   └── App.jsx
│   └── public/
│       └── index.html
└── README.md
```

---

## Backend Code

### 1. Database Configuration

**File: `backend/config/database.js`**

```javascript
const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Handles connection errors and success
 */
const connectDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/message-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit if database connection fails
  }
};

module.exports = connectDatabase;
```

---

### 2. Message Model

**File: `backend/models/Message.js`**

```javascript
const mongoose = require('mongoose');

/**
 * Message Schema
 * Defines structure for storing messages in database
 */
const messageSchema = new mongoose.Schema({
  // Message content
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000 // Limit message length
  },
  
  // User information
  userId: {
    type: String,
    required: true,
    index: true // Index for faster queries
  },
  
  username: {
    type: String,
    required: true
  },
  
  // Channel/Room identification
  channelId: {
    type: String,
    required: true,
    index: true // Index for faster channel queries
  },
  
  channelName: {
    type: String,
    required: true
  },
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: -1 // Index in descending order for recent messages
  }
}, {
  // Automatically add createdAt and updatedAt fields
  timestamps: true
});

// Compound index for efficient channel + time queries
messageSchema.index({ channelId: 1, createdAt: -1 });

// Export the model
module.exports = mongoose.model('Message', messageSchema);
```

---

### 3. Message Controller

**File: `backend/controllers/messageController.js`**

```javascript
const Message = require('../models/Message');

/**
 * Create a new message
 * Saves message to database and returns saved message
 */
const createMessage = async (req, res) => {
  try {
    const { text, userId, username, channelId, channelName } = req.body;
    
    // Validate required fields
    if (!text || !userId || !username || !channelId || !channelName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Create new message object
    const newMessage = new Message({
      text,
      userId,
      username,
      channelId,
      channelName
    });
    
    // Save to database
    const savedMessage = await newMessage.save();
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: savedMessage
    });
    
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create message',
      error: error.message
    });
  }
};

/**
 * Get messages for a specific channel
 * Supports pagination for infinite scroll
 */
const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    
    // Pagination parameters
    const limit = parseInt(req.query.limit) || 50; // Default 50 messages
    const before = req.query.before; // Timestamp for loading older messages
    
    // Build query
    const query = { channelId };
    
    // If 'before' timestamp provided, get messages older than that
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Fetch messages from database
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .lean(); // Return plain JavaScript objects (faster)
    
    // Reverse to show oldest first in UI
    const reversedMessages = messages.reverse();
    
    // Check if more messages exist
    const hasMore = messages.length === limit;
    
    res.status(200).json({
      success: true,
      data: reversedMessages,
      hasMore,
      count: reversedMessages.length
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
};

/**
 * Delete a message by ID
 * Optional: for message deletion feature
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // To verify user owns the message
    
    // Find message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user owns the message
    if (message.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }
    
    // Delete message
    await Message.findByIdAndDelete(messageId);
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

module.exports = {
  createMessage,
  getChannelMessages,
  deleteMessage
};
```

---

### 4. Message Routes

**File: `backend/routes/messages.js`**

```javascript
const express = require('express');
const router = express.Router();
const {
  createMessage,
  getChannelMessages,
  deleteMessage
} = require('../controllers/messageController');

/**
 * POST /api/messages
 * Create a new message
 */
router.post('/', createMessage);

/**
 * GET /api/messages/:channelId
 * Get messages for a specific channel
 * Query params: limit (number), before (timestamp)
 */
router.get('/:channelId', getChannelMessages);

/**
 * DELETE /api/messages/:messageId
 * Delete a message by ID
 */
router.delete('/:messageId', deleteMessage);

module.exports = router;
```

---

### 5. Server Setup

**File: `backend/server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDatabase = require('./config/database');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Frontend URL
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Connect to database
connectDatabase();

// API Routes
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

/**
 * Socket.IO Real-time Communication
 * Handles new messages and broadcasts to channel members
 */

// Track connected users by channel
const channelUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  /**
   * User joins a channel
   */
  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    
    // Track user in channel
    if (!channelUsers.has(channelId)) {
      channelUsers.set(channelId, new Set());
    }
    channelUsers.get(channelId).add(socket.id);
    
    console.log(`User ${socket.id} joined channel: ${channelId}`);
  });
  
  /**
   * User leaves a channel
   */
  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    
    // Remove user from channel tracking
    if (channelUsers.has(channelId)) {
      channelUsers.get(channelId).delete(socket.id);
    }
    
    console.log(`User ${socket.id} left channel: ${channelId}`);
  });
  
  /**
   * Handle new message
   * Saves to database and broadcasts to channel
   */
  socket.on('send-message', async (messageData) => {
    try {
      // Create message in database
      const newMessage = new Message({
        text: messageData.text,
        userId: messageData.userId,
        username: messageData.username,
        channelId: messageData.channelId,
        channelName: messageData.channelName
      });
      
      const savedMessage = await newMessage.save();
      
      // Broadcast to all users in the channel
      io.to(messageData.channelId).emit('new-message', savedMessage);
      
      console.log(`Message sent to channel ${messageData.channelId}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', {
        message: 'Failed to send message'
      });
    }
  });
  
  /**
   * Handle user disconnect
   */
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove user from all channels
    channelUsers.forEach((users, channelId) => {
      users.delete(socket.id);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## Frontend Code

### 1. Date Formatter Utility

**File: `frontend/src/utils/dateFormatter.js`**

```javascript
/**
 * Format timestamp to readable format
 * Shows different formats based on how recent the message is
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Less than 1 minute ago
  if (diffInMinutes < 1) {
    return 'Just now';
  }
  
  // Less than 1 hour ago
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than 24 hours ago
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than 7 days ago
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // More than 7 days ago - show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format timestamp to show time (HH:MM AM/PM)
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format timestamp to show full date and time
 */
export const formatFullDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};
```

---

### 2. Message Item Component

**File: `frontend/src/components/MessageItem.jsx`**

```javascript
import React from 'react';
import { formatTimestamp, formatTime } from '../utils/dateFormatter';

/**
 * Individual Message Component
 * Displays a single message with user info and timestamp
 */
const MessageItem = ({ message, currentUserId }) => {
  // Check if message is from current user
  const isOwnMessage = message.userId === currentUserId;
  
  return (
    <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      {/* User avatar (optional) */}
      <div className="message-avatar">
        {message.username.charAt(0).toUpperCase()}
      </div>
      
      {/* Message content */}
      <div className="message-content">
        {/* Username and timestamp */}
        <div className="message-header">
          <span className="message-username">{message.username}</span>
          <span className="message-time" title={formatTimestamp(message.createdAt)}>
            {formatTime(message.createdAt)}
          </span>
        </div>
        
        {/* Message text */}
        <div className="message-text">
          {message.text}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
```

---

### 3. Message Input Component

**File: `frontend/src/components/MessageInput.jsx`**

```javascript
import React, { useState } from 'react';

/**
 * Message Input Component
 * Handles message composition and sending
 */
const MessageInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim whitespace
    const trimmedMessage = message.trim();
    
    // Don't send empty messages
    if (!trimmedMessage) return;
    
    // Send message to parent component
    onSendMessage(trimmedMessage);
    
    // Clear input field
    setMessage('');
  };
  
  /**
   * Handle Enter key press (send message)
   * Shift+Enter for new line
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        {/* Message textarea */}
        <textarea
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          rows={1}
          maxLength={2000}
        />
        
        {/* Send button */}
        <button
          type="submit"
          className="send-button"
          disabled={disabled || !message.trim()}
        >
          Send
        </button>
      </div>
      
      {/* Character count (optional) */}
      <div className="character-count">
        {message.length} / 2000
      </div>
    </form>
  );
};

export default MessageInput;
```

---

### 4. Message List Component

**File: `frontend/src/components/MessageList.jsx`**

```javascript
import React, { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';

/**
 * Message List Component
 * Displays list of messages with infinite scroll
 */
const MessageList = ({ messages, onLoadMore, hasMore, loading, currentUserId }) => {
  const listRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);
  const prevScrollHeight = useRef(0);
  
  /**
   * Handle scroll event
   * Detect when user scrolls near top to load more messages
   */
  const handleScroll = () => {
    if (!listRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    
    // Check if scrolled near top (within 100px)
    const nearTop = scrollTop < 100;
    setIsNearTop(nearTop);
    
    // Load more if near top and more messages available
    if (nearTop && hasMore && !loading) {
      prevScrollHeight.current = scrollHeight;
      onLoadMore();
    }
  };
  
  /**
   * Maintain scroll position after loading older messages
   */
  useEffect(() => {
    if (!listRef.current || !prevScrollHeight.current) return;
    
    const { scrollHeight } = listRef.current;
    const heightDifference = scrollHeight - prevScrollHeight.current;
    
    // Adjust scroll position to maintain view
    if (heightDifference > 0) {
      listRef.current.scrollTop += heightDifference;
    }
    
    prevScrollHeight.current = 0;
  }, [messages]);
  
  /**
   * Auto-scroll to bottom when new message arrives
   * Only if user is already near bottom
   */
  useEffect(() => {
    if (!listRef.current || messages.length === 0) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Auto-scroll only if near bottom
    if (isNearBottom) {
      listRef.current.scrollTop = scrollHeight;
    }
  }, [messages]);
  
  return (
    <div
      className="message-list"
      ref={listRef}
      onScroll={handleScroll}
    >
      {/* Loading indicator at top */}
      {loading && (
        <div className="loading-indicator">
          <span>Loading messages...</span>
        </div>
      )}
      
      {/* No more messages indicator */}
      {!hasMore && messages.length > 0 && (
        <div className="no-more-messages">
          <span>No more messages</span>
        </div>
      )}
      
      {/* Message list */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message._id}
              message={message}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MessageList;
```

---

### 5. Chat Room Component

**File: `frontend/src/components/ChatRoom.jsx`**

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Initialize Socket.IO connection
const socket = io('http://localhost:5000');

/**
 * Main Chat Room Component
 * Manages messages, socket connection, and channel state
 */
const ChatRoom = ({ channelId, channelName, userId, username }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [connected, setConnected] = useState(false);
  
  // Set to track displayed message IDs (prevent duplicates)
  const displayedMessageIds = useRef(new Set());
  
  /**
   * Add message to list (with duplicate prevention)
   */
  const addMessage = useCallback((message) => {
    // Check if message already displayed
    if (displayedMessageIds.current.has(message._id)) {
      return; // Skip duplicate
    }
    
    // Add to displayed set
    displayedMessageIds.current.add(message._id);
    
    // Add to messages list
    setMessages((prev) => [...prev, message]);
  }, []);
  
  /**
   * Fetch initial messages when component mounts
   */
  const fetchMessages = useCallback(async (before = null) => {
    try {
      setLoading(true);
      
      // Build API URL
      let url = `http://localhost:5000/api/messages/${channelId}?limit=50`;
      if (before) {
        url += `&before=${before}`;
      }
      
      // Fetch messages from API
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Add messages to displayed set
        data.data.forEach((msg) => {
          displayedMessageIds.current.add(msg._id);
        });
        
        if (before) {
          // Prepend older messages
          setMessages((prev) => [...data.data, ...prev]);
        } else {
          // Initial load - replace all messages
          setMessages(data.data);
        }
        
        setHasMore(data.hasMore);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [channelId]);
  
  /**
   * Load more older messages (for infinite scroll)
   */
  const loadMoreMessages = useCallback(() => {
    if (messages.length === 0 || !hasMore || loading) return;
    
    // Get timestamp of oldest message
    const oldestMessage = messages[0];
    const oldestTimestamp = oldestMessage.createdAt;
    
    // Fetch older messages
    fetchMessages(oldestTimestamp);
  }, [messages, hasMore, loading, fetchMessages]);
  
  /**
   * Send new message
   */
  const sendMessage = useCallback((text) => {
    if (!connected || !text.trim()) return;
    
    // Emit message via Socket.IO
    socket.emit('send-message', {
      text,
      userId,
      username,
      channelId,
      channelName
    });
  }, [connected, userId, username, channelId, channelName]);
  
  /**
   * Setup Socket.IO connection and event listeners
   */
  useEffect(() => {
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      
      // Join the channel
      socket.emit('join-channel', channelId);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });
    
    // Listen for new messages
    socket.on('new-message', (message) => {
      addMessage(message);
    });
    
    // Listen for errors
    socket.on('message-error', (error) => {
      console.error('Message error:', error);
      alert('Failed to send message. Please try again.');
    });
    
    // Cleanup on unmount
    return () => {
      socket.emit('leave-channel', channelId);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new-message');
      socket.off('message-error');
    };
  }, [channelId, addMessage]);
  
  /**
   * Fetch initial messages on mount or channel change
   */
  useEffect(() => {
    // Clear messages when switching channels
    setMessages([]);
    displayedMessageIds.current.clear();
    setHasMore(true);
    
    // Fetch messages for new channel
    fetchMessages();
  }, [channelId, fetchMessages]);
  
  return (
    <div className="chat-room">
      {/* Channel header */}
      <div className="chat-header">
        <h2>#{channelName}</h2>
        <div className="connection-status">
          <span className={connected ? 'connected' : 'disconnected'}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Message list */}
      <MessageList
        messages={messages}
        onLoadMore={loadMoreMessages}
        hasMore={hasMore}
        loading={loading}
        currentUserId={userId}
      />
      
      {/* Message input */}
      <MessageInput
        onSendMessage={sendMessage}
        disabled={!connected}
      />
    </div>
  );
};

export default ChatRoom;
```

---

### 6. Main App Component

**File: `frontend/src/App.jsx`**

```javascript
import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import './App.css';

/**
 * Main App Component
 * Manages user state and channel selection
 */
function App() {
  // Mock user data (in real app, get from authentication)
  const [currentUser] = useState({
    userId: 'user-' + Math.random().toString(36).substr(2, 9),
    username: 'User ' + Math.floor(Math.random() * 1000)
  });
  
  // Mock channels (in real app, fetch from API)
  const [channels] = useState([
    { id: 'general', name: 'general' },
    { id: 'random', name: 'random' },
    { id: 'tech', name: 'tech' }
  ]);
  
  // Currently selected channel
  const [selectedChannel, setSelectedChannel] = useState(channels[0]);
  
  return (
    <div className="app">
      {/* Sidebar with channel list */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Channels</h3>
        </div>
        
        <div className="channel-list">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`channel-item ${selectedChannel.id === channel.id ? 'active' : ''}`}
              onClick={() => setSelectedChannel(channel)}
            >
              # {channel.name}
            </div>
          ))}
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.username.charAt(0)}
          </div>
          <span className="user-name">{currentUser.username}</span>
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="main-content">
        <ChatRoom
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          userId={currentUser.userId}
          username={currentUser.username}
        />
      </div>
    </div>
  );
}

export default App;
```

---

### 7. Basic CSS Styles

**File: `frontend/src/App.css`**

```css
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f5f5f5;
}

/* App layout */
.app {
  display: flex;
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background-color: #2c2f33;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #1e2124;
}

.sidebar-header h3 {
  font-size: 16px;
  font-weight: 600;
}

/* Channel list */
.channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.channel-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.channel-item:hover {
  background-color: #3a3d42;
}

.channel-item.active {
  background-color: #5865f2;
}

/* User info */
.user-info {
  padding: 15px;
  border-top: 1px solid #1e2124;
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #5865f2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-name {
  font-size: 14px;
}

/* Main content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Chat room */
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
}

/* Chat header */
.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.connection-status {
  font-size: 12px;
}

.connected {
  color: #43b581;
}

.disconnected {
  color: #f04747;
}

/* Message list */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-indicator,
.no-more-messages {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* Message item */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #5865f2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-username {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-text {
  color: #333;
  line-height: 1.5;
  word-wrap: break-word;
}

/* Own message styling (optional) */
.own-message .message-avatar {
  background-color: #43b581;
}

/* Message input */
.message-input-form {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #5865f2;
}

.send-button {
  padding: 12px 24px;
  background-color: #5865f2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #4752c4;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.character-count {
  margin-top: 5px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

---

## Package.json Files

### Backend

**File: `backend/package.json`**

```json
{
  "name": "message-system-backend",
  "version": "1.0.0",
  "description": "Message system backend with MongoDB and Socket.IO",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

### Frontend

**File: `frontend/package.json`**

```json
{
  "name": "message-system-frontend",
  "version": "1.0.0",
  "description": "Message system frontend with React",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

---

## Setup Instructions (README.md)

```markdown
# Message System

A real-time chat application with MongoDB, Express, React, and Socket.IO.

## Features

- ✅ Send and receive messages in real-time
- ✅ Multiple channels support
- ✅ Store messages in MongoDB
- ✅ Infinite scroll to load older messages
- ✅ Duplicate message prevention
- ✅ Proper timestamp formatting
- ✅ User-friendly interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

### 1. Install MongoDB

Download and install MongoDB from https://www.mongodb.com/try/download/community

Start MongoDB:
```bash
mongod
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Select a channel from the sidebar
3. Type a message and click Send
4. Scroll up to load older messages

## API Endpoints

- POST `/api/messages` - Create new message
- GET `/api/messages/:channelId` - Get messages for channel
- DELETE `/api/messages/:messageId` - Delete a message

## Socket.IO Events

- `join-channel` - Join a channel
- `leave-channel` - Leave a channel
- `send-message` - Send a new message
- `new-message` - Receive new message

## Project Structure

```
message-system/
├── backend/          # Express server
├── frontend/         # React app
└── README.md         # This file
```

## Technologies Used

- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Frontend**: React, Socket.IO Client
- **Database**: MongoDB

## License

MIT
```

---

This complete implementation includes all the features you requested with detailed comments explaining each part!