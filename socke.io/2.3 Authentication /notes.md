# Socket.IO Authentication with JWT - Theory Notes

## 📚 Complete Theory in Simple English

---

## 1. What is JWT (JSON Web Token)?

### **Basic Concept**
```
JWT = Digital Identity Card

Real Life Example:
- Your school ID card proves you are a student
- JWT proves you are an authenticated user

Structure of JWT:
xxxxx.yyyyy.zzzzz
  ↓     ↓     ↓
Header.Payload.Signature

Example JWT:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6ImpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### **Three Parts Explained**

#### **Part 1: Header (xxxxx)**
```json
{
  "alg": "HS256",      // Algorithm used (HMAC SHA256)
  "typ": "JWT"         // Token type
}
```
- Tells what type of token it is
- Which algorithm is used to create signature

#### **Part 2: Payload (yyyyy)**
```json
{
  "userId": "123",
  "username": "john",
  "email": "john@example.com",
  "iat": 1516239022,   // Issued at (timestamp)
  "exp": 1516325422    // Expires at (timestamp)
}
```
- Contains user data
- This is what you want to store and verify
- Anyone can decode this (it's not encrypted, just encoded)

#### **Part 3: Signature (zzzzz)**
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```
- Created using secret key (only server knows)
- Verifies token hasn't been tampered with
- Cannot be created without the secret key

---

## 2. Why Use JWT for Socket Authentication?

### **Problem Without Authentication**
```javascript
// Anyone can connect
io.on("connection", (socket) => {
  // Who is this user? 🤷‍♂️
  // Can we trust them? 🤷‍♂️
  // Are they logged in? 🤷‍♂️
});
```

### **Solution With JWT**
```javascript
// Only authenticated users can connect
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  
  if (user) {
    socket.user = user; // Now we know who they are! ✅
    next(); // Allow connection
  } else {
    next(new Error("Invalid token")); // Reject connection ❌
  }
});
```

### **Benefits**
1. **Stateless** - Server doesn't need to store session data
2. **Scalable** - Works across multiple servers
3. **Secure** - Can't be forged without secret key
4. **Self-contained** - Token contains all user info
5. **Expirable** - Automatically expires after set time

---

## 3. How Socket Authentication Works - Step by Step

### **Step 1: User Login Flow**
```
User enters credentials
        ↓
POST /api/auth/login
        ↓
Server verifies username/password
        ↓
If valid:
  - Generate JWT token
  - Send token to client
        ↓
Client saves token (localStorage/cookie)
```

**Code Example:**
```javascript
// Server creates token
const token = jwt.sign(
  { userId: "123", username: "john" }, // Payload
  "secret-key",                        // Secret
  { expiresIn: "7d" }                  // Options
);

// Client receives and stores
localStorage.setItem("token", token);
```

---

### **Step 2: Socket Connection with Token**
```
Client wants to connect to socket
        ↓
Client sends token with connection request
        ↓
Server receives connection attempt
        ↓
Server runs authentication middleware
        ↓
Middleware extracts token
        ↓
Middleware verifies token
        ↓
If valid: Allow connection
If invalid: Reject connection
```

**Code Example:**
```javascript
// CLIENT: Send token with connection
const socket = io("http://localhost:3000", {
  auth: {
    token: localStorage.getItem("token")
  }
});

// SERVER: Verify token
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, "secret-key");
    socket.user = decoded; // Attach user info
    next(); // Allow connection
  } catch (error) {
    next(new Error("Authentication failed")); // Reject
  }
});
```

---

### **Step 3: Using Authenticated User Data**
```
User connected successfully
        ↓
socket.user contains verified user data
        ↓
All events can access socket.user
        ↓
Use for authorization and logging
```

**Code Example:**
```javascript
io.on("connection", (socket) => {
  // socket.user is already set by middleware
  console.log("User connected:", socket.user.username);
  
  socket.on("sendMessage", (data) => {
    // We know who sent this message
    io.emit("message", {
      userId: socket.user.userId,
      username: socket.user.username,
      message: data.message
    });
  });
});
```

---

## 4. Token Storage Options

### **Option 1: localStorage**
```javascript
// Store
localStorage.setItem("token", token);

// Retrieve
const token = localStorage.getItem("token");

// Remove
localStorage.removeItem("token");
```

**Pros:**
- ✅ Simple to use
- ✅ Persists across browser sessions
- ✅ Easy to access from JavaScript

**Cons:**
- ❌ Vulnerable to XSS (Cross-Site Scripting) attacks
- ❌ Accessible to all JavaScript code on page
- ❌ Not automatically sent with requests

**When to Use:**
- Development/learning
- Low-security applications
- When XSS protection is already strong

---

### **Option 2: HttpOnly Cookies**
```javascript
// SERVER: Set cookie
res.cookie("token", token, {
  httpOnly: true,  // Cannot be accessed by JavaScript
  secure: true,    // Only sent over HTTPS
  sameSite: "strict", // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// CLIENT: Cookies automatically sent
// No need to manually attach token
fetch("/api/data", {
  credentials: "include" // Include cookies
});
```

**Pros:**
- ✅ More secure (not accessible to JavaScript)
- ✅ Automatically sent with requests
- ✅ XSS protection (httpOnly flag)
- ✅ CSRF protection (sameSite flag)

**Cons:**
- ❌ More complex setup
- ❌ Requires CORS configuration
- ❌ Harder to debug

**When to Use:**
- Production applications
- High-security requirements
- When handling sensitive data

---

### **Option 3: Memory (React State)**
```javascript
const [token, setToken] = useState(null);

// Store
setToken(receivedToken);

// Use
socket = io(url, { auth: { token } });
```

**Pros:**
- ✅ Most secure (exists only in memory)
- ✅ Cannot be accessed by XSS
- ✅ Automatically cleared on page close

**Cons:**
- ❌ Lost on page refresh
- ❌ User must login again
- ❌ Poor user experience

**When to Use:**
- Maximum security needed
- Short-lived sessions
- Sensitive operations

---

## 5. Middleware Concept

### **What is Middleware?**
```
Middleware = Gate Keeper / Security Guard

Without Middleware:
Request → Directly to Handler

With Middleware:
Request → Middleware (checks auth) → Handler
                ↓
          If invalid, STOP
```

### **Socket.IO Middleware Flow**
```javascript
// Middleware runs BEFORE connection is established
io.use((socket, next) => {
  // Step 1: Extract token
  const token = socket.handshake.auth.token;
  
  // Step 2: Validate
  if (!token) {
    return next(new Error("No token")); // STOP - Reject
  }
  
  // Step 3: Verify
  const user = verifyToken(token);
  if (!user) {
    return next(new Error("Invalid token")); // STOP - Reject
  }
  
  // Step 4: Attach user info
  socket.user = user;
  
  // Step 5: Allow connection
  next(); // CONTINUE - Accept
});

// This runs ONLY if middleware passed
io.on("connection", (socket) => {
  // socket.user is guaranteed to exist
  console.log("Authenticated user:", socket.user.username);
});
```

---

## 6. Attaching Token in Socket Connection

### **Method 1: auth Object (Recommended)**
```javascript
const socket = io("http://localhost:3000", {
  auth: {
    token: "your-jwt-token-here"
  }
});

// SERVER ACCESS:
socket.handshake.auth.token
```

**Why Recommended:**
- ✅ Built-in Socket.IO feature
- ✅ Secure (not visible in URL)
- ✅ Clean and organized
- ✅ Best practice

---

### **Method 2: query Parameters**
```javascript
const socket = io("http://localhost:3000", {
  query: {
    token: "your-jwt-token-here"
  }
});

// SERVER ACCESS:
socket.handshake.query.token

// URL looks like:
// ws://localhost:3000/socket.io/?token=xxx&EIO=4&transport=websocket
```

**Issues:**
- ❌ Token visible in URL/logs
- ❌ Can be logged by proxies
- ❌ Security risk
- ⚠️ Only use for development/debugging

---

### **Method 3: extraHeaders**
```javascript
const socket = io("http://localhost:3000", {
  extraHeaders: {
    "Authorization": "Bearer your-jwt-token-here"
  }
});

// SERVER ACCESS:
socket.handshake.headers.authorization
```

**When to Use:**
- API-style authentication
- Following REST conventions
- Integrating with existing auth systems

---

## 7. Verifying Token on Connection

### **Complete Verification Process**

#### **Step 1: Extract Token**
```javascript
const token = socket.handshake.auth?.token;

// Check multiple sources (fallback)
const token = 
  socket.handshake.auth?.token ||      // Primary
  socket.handshake.query?.token ||     // Fallback 1
  socket.handshake.headers?.authorization; // Fallback 2
```

#### **Step 2: Check Token Exists**
```javascript
if (!token) {
  return next(new Error("No token provided"));
}
```

#### **Step 3: Verify Token Signature**
```javascript
try {
  const decoded = jwt.verify(token, SECRET_KEY);
  // Token is valid
} catch (error) {
  // Token is invalid, expired, or tampered
  return next(new Error("Invalid token"));
}
```

#### **Step 4: Check Token Expiration**
```javascript
const decoded = jwt.verify(token, SECRET_KEY);

if (decoded.exp < Date.now() / 1000) {
  return next(new Error("Token expired"));
}
```

#### **Step 5: Attach User Data**
```javascript
socket.user = {
  userId: decoded.userId,
  username: decoded.username,
  email: decoded.email
};
```

#### **Step 6: Allow Connection**
```javascript
next(); // Connection successful
```

---

## 8. Kicking Invalid Users

### **Automatic Kick (Middleware)**
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!isValidToken(token)) {
    // User is automatically kicked
    // Connection is never established
    return next(new Error("Invalid token"));
  }
  
  next();
});
```

**How it Works:**
1. User tries to connect
2. Middleware checks token
3. If invalid, `next(Error)` is called
4. Socket.IO rejects connection
5. User never gets connected
6. `connect_error` event fires on client

---

### **Manual Kick (During Session)**
```javascript
io.on("connection", (socket) => {
  
  // Kick user after some condition
  socket.on("someEvent", () => {
    if (userViolatedRules) {
      // Send notification
      socket.emit("kicked", {
        reason: "Rule violation"
      });
      
      // Force disconnect
      socket.disconnect(true); // true = close transport
    }
  });
  
  // Kick after token expires
  setTimeout(() => {
    socket.emit("sessionExpired", {
      message: "Please login again"
    });
    socket.disconnect(true);
  }, TOKEN_EXPIRY_TIME);
});
```

---

### **Client-Side Handling**
```javascript
const socket = io(url, { auth: { token } });

// Handle authentication errors
socket.on("connect_error", (error) => {
  if (error.message.includes("Authentication")) {
    // Token is invalid
    alert("Session expired. Please login again.");
    redirectToLogin();
  }
});

// Handle manual kick
socket.on("kicked", (data) => {
  alert(`You were kicked: ${data.reason}`);
  socket.disconnect();
  redirectToLogin();
});

// Handle session expiry
socket.on("sessionExpired", (data) => {
  alert(data.message);
  redirectToLogin();
});
```

---

## 9. Security Best Practices

### **1. Use Strong Secret Keys**
```javascript
// ❌ BAD
const SECRET = "123";

// ✅ GOOD
const SECRET = process.env.JWT_SECRET;
// .env: JWT_SECRET=a8f5jd93kf73h5d9f7h3k5j7g8h4j6k2l9m3n5p7q1r4s6t8u2v5w7x9y1z3
```

### **2. Set Token Expiration**
```javascript
// ❌ BAD - Never expires
jwt.sign(payload, secret);

// ✅ GOOD - Expires in 7 days
jwt.sign(payload, secret, { expiresIn: "7d" });
```

### **3. Validate Input**
```javascript
// ❌ BAD - Trust user input
socket.on("sendMessage", (data) => {
  broadcast(data.message);
});

// ✅ GOOD - Validate and sanitize
socket.on("sendMessage", (data) => {
  if (!data.message || typeof data.message !== "string") {
    return socket.emit("error", "Invalid message");
  }
  
  const cleanMessage = sanitize(data.message);
  broadcast(cleanMessage);
});
```

### **4. Use HTTPS in Production**
```javascript
// ❌ BAD - HTTP in production
const socket = io("http://example.com");

// ✅ GOOD - HTTPS in production
const socket = io("https://example.com", {
  secure: true
});
```

### **5. Implement Rate Limiting**
```javascript
const messageCount = new Map();

socket.on("sendMessage", (data) => {
  const count = messageCount.get(socket.id) || 0;
  
  if (count > 10) { // Max 10 messages per minute
    return socket.emit("error", "Rate limit exceeded");
  }
  
  messageCount.set(socket.id, count + 1);
  
  setTimeout(() => {
    messageCount.delete(socket.id);
  }, 60000); // Reset after 1 minute
});
```

---

## 10. Common Authentication Patterns

### **Pattern 1: JWT + localStorage**
```
Login → Server generates JWT → Client stores in localStorage → 
Socket connects with token from localStorage → Server verifies
```

**Use Case:** Simple apps, low security requirements

---

### **Pattern 2: JWT + HttpOnly Cookies**
```
Login → Server generates JWT → Server sets HttpOnly cookie → 
Socket connects (cookie auto-sent) → Server verifies from cookie
```

**Use Case:** Production apps, high security

---

### **Pattern 3: Refresh Token Pattern**
```
Login → Server gives:
  - Access Token (short-lived: 15 min)
  - Refresh Token (long-lived: 7 days)
→ Use access token for socket
→ When expired, use refresh token to get new access token
```

**Use Case:** Maximum security, banking apps

---

### **Pattern 4: Session + Socket.IO**
```
Login → Create session → Store session ID in cookie →
Socket.IO session middleware checks session ID →
If valid, attach user to socket
```

**Use Case:** Traditional session-based apps

---

## 11. Complete Authentication Flow Diagram

```
┌─────────────┐
│   CLIENT    │
└──────┬──────┘
       │ 1. Login Request (email, password)
       ↓
┌─────────────┐
│   SERVER    │
└──────┬──────┘
       │ 2. Verify Credentials
       │ 3. Generate JWT Token
       ↓
┌─────────────┐
│   CLIENT    │ 4. Store Token (localStorage/cookie)
└──────┬──────┘
       │ 5. Connect Socket with Token
       │    io(url, { auth: { token } })
       ↓
┌─────────────┐
│  MIDDLEWARE │ 6. Extract Token
└──────┬──────┘    socket.handshake.auth.token
       │
       │ 7. Verify Token
       │    jwt.verify(token, secret)
       │
       ├─→ Valid? ──→ next() ──→ CONNECTION ALLOWED
       │
       └─→ Invalid? → next(Error) → CONNECTION REJECTED
                                           ↓
                                    connect_error event
                                    on client side
```

---

This covers all the theory you need to understand JWT authentication in Socket.IO! 🎓