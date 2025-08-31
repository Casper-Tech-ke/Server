// CASPER Server v2 - Node.js + Express + Socket.io (with native fetch, Node.js 18+)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory data stores for demonstration ---
let users = []; // { id, name, status, ip }
let privateMessages = []; // {from, to, message, time}
let adminBroadcasts = []; // {message, time, ip}
let feedbacks = []; // {from, category, message, time}
let chatRoomMessages = []; // {from, text, time}

// --- Socket.io events ---
io.on("connection", socket => {
  let userName = null;
  let userIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

  // User joins server (for private chat and dashboard)
  socket.on("user-join", name => {
    userName = name;
    // Remove any user with same socket id (refresh)
    users = users.filter(u => u.id !== socket.id);
    users.push({ id: socket.id, name, status: "active", ip: userIp });
    io.emit("user-list", users);
  });

  // --- AI Chatbot (ai-chat.html) ---
  socket.on("ai-message", async (msg) => {
    let text = (msg && msg.text) ? msg.text : "";
    let aiReply = "";
    if (/who (are|is) your? (developer|creator)/i.test(text)) {
      aiReply = "I was created by David Cyril Tech.";
    } else if (/who are you|your name/i.test(text)) {
      aiReply = "I am CASPER AI, your personal assistant.";
    } else {
      // Try main AI API, then fallback to backups
      const endpoints = [
        `https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(text)}`,
        `https://apis.davidcyriltech.my.id/ai/deepseek-r1?text=${encodeURIComponent(text)}`,
        `https://apis.davidcyriltech.my.id/ai/metaai?text=${encodeURIComponent(text)}`,
        `https://apis.davidcyriltech.my.id/ai/gpt3?text=${encodeURIComponent(text)}`,
        `https://apis.davidcyriltech.my.id/ai/gpt4omini?text=${encodeURIComponent(text)}`,
        `https://apis.davidcyriltech.my.id/ai/gpt4?text=${encodeURIComponent(text)}`,
      ];
      for (let url of endpoints) {
        try {
          const r = await fetch(url);
          const data = await r.json();
          if (data && data.result) {
            aiReply = data.result;
            break;
          }
          // Try other possible string fields
          const value = Object.values(data).find(v => typeof v === "string" && v.length > 4);
          if (value) {
            aiReply = value;
            break;
          }
        } catch { /* continue to next endpoint */ }
      }
      if (!aiReply) aiReply = "Sorry, CASPER AI is not responding right now.";
    }
    socket.emit("ai-reply", { text: aiReply });
  });

  // --- Private Messaging (private-chat.html) ---
  socket.on("private-message", ({from, to, message}) => {
    privateMessages.push({from, to, message, time: Date.now()});
    // Send to recipient and to admin (here: broadcast to all for demo; in prod, send only to recipient/admin)
    io.emit("private-message", {from, to, message, time: Date.now()});
  });

  // --- Contact Admin/Feedback ---
  socket.on("feedback", ({from, category, message}) => {
    feedbacks.push({from, category, message, time: Date.now()});
    io.emit("admin-feedback", {from, category, message, time: Date.now()});
  });

  // --- Admin Broadcast ---
  socket.on("broadcast", ({message}) => {
    adminBroadcasts.push({message, time: Date.now(), ip: userIp});
    io.emit("broadcast", {message, time: Date.now()});
  });

  // --- Dashboard (dashboard.html) data request ---
  socket.on("dashboard-request", () => {
    socket.emit("dashboard-data", {
      members: users,
      broadcasts: adminBroadcasts,
      feedbacks,
      privateMessages
    });
  });

  // --- Live Chat Room (chat-room.html) ---
  socket.on("chat-room-message", ({from, text}) => {
    const msg = {from, text, time: Date.now()};
    chatRoomMessages.push(msg);
    io.emit("chat-room-message", msg);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("user-list", users);
  });
});

// Fallback: always serve index.html for unknown routes (SPA support)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("CASPER Server running on port", PORT));
