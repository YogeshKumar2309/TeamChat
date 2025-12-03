````md
# 1.1 Understanding Socket.IO (1 Hour)

## ⭐ What are WebSockets?
- A WebSocket is a connection that stays **open** between client and server.
- Both can send messages to each other anytime.
- Best for **real-time apps** like chat, live updates, games.

---

## ⭐ HTTP vs WebSocket

### **HTTP**
- Works only as **request → response**.
- Connection closes after every request.
- Slow for real-time features.
- Example:
  - Client: "Do you have new messages?"
  - Server: "Yes/No" → then closes.

### **WebSocket**
- Connection stays **open**.
- Server can send updates without asking.
- Fast and perfect for chat apps.

---

## ⭐ How Socket.IO Works (Simple Explanation)
- Socket.IO uses WebSockets internally.
- If WebSockets fail, it uses other methods (like polling).
- It helps with:
  - Auto reconnect
  - Tracking online users
  - Creating rooms
  - Sending events easily

### Two parts:
1. **Server:** `socket.io` (Node.js)
2. **Client:** `socket.io-client` (React)

---

## ⭐ Event-based Communication

Everything works through **events**.

### Example:

Client:
```js
socket.emit("send-message", "Hello");
````

Server:

```js
socket.on("send-message", msg => {
  console.log(msg);
});
```

Server → client:

```js
socket.emit("new-message", "Hi there");
```

Client:

```js
socket.on("new-message", msg => {
  console.log(msg);
});
```

---

## ⭐ Client ↔ Server Lifecycle (Very Simple)

1. **Client tries to connect**
2. **Server checks token**
3. **Connection is created**
4. Both can send/receive messages
5. If internet drops → disconnect
6. Socket.IO tries to reconnect automatically

---


```
