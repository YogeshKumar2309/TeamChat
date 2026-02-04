Nice — below is a **complete, fully functional practice project** you can copy & run right now.
It implements:

* Express server with `/login` that issues JWTs (for testing)
* Socket.IO server that **verifies JWT during handshake** (auth: { token })
* If token missing/invalid → connection is rejected (user kicked) with a `connect_error` on client
* Client shows login flow, connects with token, handles `connect_error`, receives server events
* Full file structure, `package.json`, commands, and thorough inline comments explaining every step

I’m giving both **server** and **client (React)** code. All code is commented with what each part does.

---

# Secure-Socket-Practice (Markdown guide + code)

> Copy the relevant code into files as shown in the file structure, install dependencies and run.

## File structure

```
secure-socket-practice/
├─ server/
│  ├─ package.json
│  ├─ .env.example
│  └─ index.js
└─ client/
   ├─ package.json
   └─ src/
      ├─ index.js
      └─ App.js
```

---

## Server — code (server/index.js)

Create `server/package.json` (below) and `server/index.js`. Use `.env` or replace with hard-coded secret for quick testing.

### server/package.json

```json
{
  "name": "secure-socket-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0",
    "socket.io": "^4.7.2",
    "dotenv": "^16.0.3",
    "body-parser": "^1.20.2"
  }
}
```

### server/.env.example

```
PORT=3001
JWT_SECRET=very_secret_key_for_testing_only_change_in_prod
JWT_EXPIRY=1h
```

### server/index.js

```js
/**
 * index.js
 * Secure Socket.IO server that validates JWT tokens on connection handshake.
 *
 * - /login -> issues a JWT for testing (use email/password)
 * - Socket.IO middleware: reads socket.handshake.auth.token, verifies JWT
 * - If token missing/invalid -> reject connection (kicked)
 * - After connecting, server emits greeting and maintains online user count
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "very_secret_key_for_testing_only_change_in_prod";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -----------------------------
// SIMPLE LOGIN FOR TESTING
// -----------------------------
// For practice: we hardcode a demo user. In production use DB and hashed passwords.
const demoUser = {
  id: "u1",
  name: "Yogesh Kumar",
  email: "yogesh@example.com",
  password: "yogesh@123" // only for demo, never store plaintext in real apps
};

// POST /login
// Accepts { email, password } and returns { token }
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // simple check against demo user
  if (email === demoUser.email && password === demoUser.password) {
    // Create JWT payload. Keep minimal info needed.
    const payload = { id: demoUser.id, name: demoUser.name, email: demoUser.email };

    // Sign token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Optional route to verify token quickly via REST:
app.get("/verify", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ valid: false, message: "No token provided" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, payload });
  } catch (err) {
    return res.status(401).json({ valid: false, message: err.message });
  }
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*" // for dev only; restrict in production
  }
});

// -----------------------------
// Socket.IO AUTH MIDDLEWARE
// -----------------------------
// This middleware runs before 'connection' event.
// We will read the token from socket.handshake.auth.token
io.use((socket, next) => {
  // token should be sent from client in handshake: io(URL, { auth: { token } })
  const token = socket.handshake.auth?.token;

  // If token is missing, reject connection:
  if (!token) {
    // Passing an Error to next will make the client receive 'connect_error' with that message
    return next(new Error("NO_TOKEN_PROVIDED"));
  }

  // Verify JWT
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach user info to socket object for later use
    socket.user = payload;

    // If you want to implement token revocation, check here against a blacklist.
    // e.g., if (isRevoked(token)) return next(new Error("TOKEN_REVOKED"));

    return next(); // allow connection
  } catch (err) {
    // Invalid or expired token -> reject
    return next(new Error("INVALID_OR_EXPIRED_TOKEN"));
  }
});

// -----------------------------
// CONNECTION HANDLER
// -----------------------------
io.on("connection", (socket) => {
  // At this point, the socket is authenticated and socket.user exists
  console.log("User connected:", socket.user?.name || socket.id);

  // Send a welcome/greeting event (private)
  socket.emit("greeting", {
    message: `Welcome ${socket.user.name}!`,
    user: socket.user
  });

  // Broadcast updated online count to all connected clients
  io.emit("onlineCount", { count: io.engine.clientsCount });

  // Example: listen for 'ping' and reply with 'pong'
  socket.on("ping", (cb) => {
    // cb is optional acknowledgement callback from client
    if (cb && typeof cb === "function") cb({ pong: true, time: Date.now() });
    socket.emit("pong", { time: Date.now() });
  });

  // Example: simple chat message (no DB) - broadcast to everyone
  socket.on("chatMessage", (data) => {
    // data should be { text: string }
    const payload = {
      text: data.text,
      from: socket.user.name,
      time: Date.now()
    };
    io.emit("chatMessage", payload);
  });

  // Disconnect handler
  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.user?.name || socket.id, "Reason:", reason);
    io.emit("onlineCount", { count: io.engine.clientsCount });
  });
});

// -----------------------------
// START SERVER
// -----------------------------
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("POST /login -> { email, password } to get test JWT");
});
```

---

## Client — React app (client/src)

This is a minimal React client showing:

* Login form → call `/login` to get token
* Connect to Socket.IO with token sent in handshake `auth: { token }`
* Handle `connect_error` (when kicked)
* Show greeting & messages

### client/package.json

```json
{
  "name": "secure-socket-client",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2",
    "axios": "^1.4.0"
  },
  "scripts": {
    "start": "parcel src/index.html --port 3000",
    "build": "parcel build src/index.html"
  },
  "devDependencies": {
    "parcel": "^2.9.3"
  }
}
```

> I used Parcel for simple zero-config dev server. You can also use `create-react-app` and place the same `App.js` in `src/`.

### client/src/index.html

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Secure Socket Client</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

### client/src/index.js

```js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
```

### client/src/App.js

```js
/**
 * App.js
 * Minimal React client that:
 * - Logs in to get a JWT (POST /login)
 * - Connects to Socket.IO using auth: { token }
 * - Handles connect_error (kicked) and shows messages
 */

import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const SERVER = "http://localhost:3001";

export default function App() {
  const [email, setEmail] = useState("yogesh@example.com");
  const [password, setPassword] = useState("yogesh@123");
  const [token, setToken] = useState(null);
  const [connected, setConnected] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  // Connect socket when token is available
  useEffect(() => {
    if (!token) return;

    // Create socket and send token in handshake auth
    const socket = io(SERVER, {
      auth: { token },
      // optional config:
      transports: ["websocket"],
      // reconnection attempts, etc, can be set here
    });

    // Save ref for later use
    socketRef.current = socket;

    // Handle successful connect
    socket.on("connect", () => {
      console.log("Socket connected, id:", socket.id);
      setConnected(true);
    });

    // Handle greeting event from server
    socket.on("greeting", (p) => {
      console.log("Greeting:", p);
      setGreeting(p.message || "Hello");
    });

    // online count
    socket.on("onlineCount", (data) => {
      setOnlineCount(data.count);
    });

    // Chat messages
    socket.on("chatMessage", (m) => {
      setMessages((prev) => [m, ...prev]);
    });

    // Pong reply from server
    socket.on("pong", (p) => {
      console.log("Pong received:", p);
    });

    // IMPORTANT: handle connection errors (this is where token rejects show up)
    socket.on("connect_error", (err) => {
      // err is an Error object from server middleware -> err.message contains reason
      console.log("Connection error:", err);
      alert("Socket connection failed: " + err.message);
      setConnected(false);

      // If you want to remove token from UI when kicked, clear it:
      // setToken(null);

      // Ensure socket is closed after failed auth to clean up
      try {
        socket.close();
      } catch (e) {}
    });

    // On disconnect
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setConnected(false);
    });

    // Cleanup on unmount or token change
    return () => {
      if (socket) socket.close();
    };
  }, [token]);

  // Login handler -> get JWT
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${SERVER}/login`, { email, password });
      setToken(res.data.token);
      alert("Login success, token acquired. Socket will try to connect.");
    } catch (err) {
      console.error(err);
      alert("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  // Send test ping
  const sendPing = () => {
    const s = socketRef.current;
    if (!s || !s.connected) return alert("Socket not connected");
    // Use acknowledgement callback
    s.emit("ping", (ack) => {
      console.log("Ack from server:", ack);
    });
  };

  // Send chat message
  const sendChat = () => {
    const s = socketRef.current;
    const text = prompt("Type message to broadcast:");
    if (!text) return;
    s.emit("chatMessage", { text });
  };

  // Force disconnect (client side)
  const disconnectSocket = () => {
    const s = socketRef.current;
    if (!s) return;
    s.disconnect();
    setConnected(false);
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h1>Secure Socket — Practice</h1>

      <section style={{ marginBottom: 20 }}>
        <h3>1) Login to get JWT (demo credentials prefilled)</h3>
        <div>
          <label>Email: </label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password: </label>
          <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button onClick={handleLogin} style={{ marginTop: 8 }}>
          Login & Get Token
        </button>
        <div style={{ marginTop: 8 }}>
          <strong>Token:</strong>
          <div style={{ wordBreak: "break-all", maxWidth: 600 }}>{token || "No token yet"}</div>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h3>2) Socket Status</h3>
        <div>Connected: {connected ? "Yes" : "No"}</div>
        <div>Greeting: {greeting}</div>
        <div>Online Users: {onlineCount}</div>
        <button onClick={sendPing} disabled={!connected} style={{ marginRight: 8 }}>
          Send Ping
        </button>
        <button onClick={sendChat} disabled={!connected} style={{ marginRight: 8 }}>
          Send Chat
        </button>
        <button onClick={disconnectSocket}>Disconnect Socket</button>
      </section>

      <section>
        <h3>3) Chat Messages (latest first)</h3>
        <ul>
          {messages.map((m, idx) => (
            <li key={idx}>
              <b>{m.from}:</b> {m.text} <small>({new Date(m.time).toLocaleTimeString()})</small>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 20, fontSize: 12, color: "#666" }}>
        <div><strong>Demo credentials:</strong> yogesh@example.com / yogesh@123</div>
        <div>Try changing token to invalid value to see 'kick' behavior: e.g., manually set token to "abc" in the UI (by clearing it and pasting), then reconnect.</div>
      </section>
    </div>
  );
}
```

---

## How to run (quick steps)

1. Open two terminals.

### Start server:

```bash
cd secure-socket-practice/server
# create .env from .env.example or export needed vars
# e.g. on linux:
# cp .env.example .env
npm install
npm start
# server runs at http://localhost:3001
```

### Start client:

```bash
cd secure-socket-practice/client
npm install
npm start
# opens dev server (parcel) at http://localhost:3000
# open http://localhost:3000 in browser
```

2. On client: use demo credentials (pre-filled): `yogesh@example.com` / `yogesh@123` → click Login.
   The server will return a JWT, the client will use the token to connect to Socket.IO.

3. If you manually change token to a wrong value (e.g., `abc`) or leave it blank and try to connect, you'll see an alert `Socket connection failed: INVALID_OR_EXPIRED_TOKEN` (or `NO_TOKEN_PROVIDED`) and the socket is closed — that is the "kick" behavior.

---

## Advanced notes & suggestions (for practice / extension)

* **Token expiry handling:** JWT created with expiry (`1h` by default). When token expires, client gets `connect_error` on new connection attempt. For long lived sockets you may want to implement token refresh and re-authentication (disconnect and reconnect with new token) or use short re-auth checks.
* **Revocation / Force logout:** Maintain a server-side blacklist (set) of revoked tokens. In middleware, check `isRevoked(token)`. To kick already connected sockets when you revoke, iterate `io.sockets.sockets` find sockets whose token matches and call `socket.disconnect(true)`.
* **Use cookies instead of auth field:** You can also authenticate using a cookie — but when using cookies with socket.io you need to ensure the handshake sends cookies (cross-origin config) and perform server-side verify from `socket.request.headers.cookie`.
* **Production:** Use HTTPS/WSS, set proper CORS origins, rotate secrets, store users hashed (bcrypt), store tokens securely, rate-limit login endpoint.
* **Rooms & roles:** After authenticating, use `socket.join('room-name')`, and check `socket.user.role` to allow or disallow joining certain rooms.

---

## Quick example: how to force-kick a connected client after token revocation (server-side snippet)

Add this function somewhere in server:

```js
// Example: Kick sockets whose token payload id === userIdToRevoke
function kickUserById(userIdToRevoke) {
  for (const [id, socket] of io.of("/").sockets) {
    if (socket.user && socket.user.id === userIdToRevoke) {
      socket.emit("kicked", { reason: "Token revoked by admin" });
      socket.disconnect(true); // force disconnect
    }
  }
}
```

Call `kickUserById("u1")` to immediately disconnect that user's active sockets.

---

## Summary / TL;DR

* Server verifies JWT during handshake (socket.handshake.auth.token).
* If token missing or invalid → `next(new Error("..."))` in middleware → client receives `connect_error` and is effectively kicked.
* Client shows how to login, get token, and connect with `io(SERVER, { auth: { token }})`.
* Example shows ping-pong, online count, simple chat and how to handle `connect_error`.

---


