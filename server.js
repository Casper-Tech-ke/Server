// server.js - Main Node.js backend for CASPER Server with Socket.io

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch'); // For AI REST API calls
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory data stores for demo ---
let users = []; // { id, name, status, ip }
let privateMessages = []; // {from, to, message, time}
let adminBroadcasts = []; // {message, time, ip}
let feedbacks = []; // {from, category, message, time}

// --- Socket.io events ---
io.on("connection", socket => {
  let userName = null;
  let userIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

  // User joins server (sent from client)
  socket.on("user-join", name => {
    userName = name;
    // Remove any user with same socket id (refresh)
    users = users.filter(u => u.id !== socket.id);
    users.push({ id: socket.id, name, status: "active", ip: userIp });
    io.emit("user-list", users);
  });

  // AI chat
  socket.on("ai-message", async (msg) => {
    let text = (msg && msg.text) ? msg.text : "";
    let aiReply = "";
    if (/who (are|is) your? (developer|creator)/i.test(text)) {
      aiReply = "I was created by CASPER TECH KENYA.";
    } else if (/who are you|your name/i.test(text)) {
      aiReply = "I am CASPER AI, your personal assistant.";
    } else {
      // Call main AI API, fallback to backup APIs if needed
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
        } catch { /* skip to next */ }
      }
      if (!aiReply) aiReply = "Sorry, CASPER AI is not responding right now.";
    }
    socket.emit("ai-reply", { text: aiReply });
  });

  // Private messaging
  socket.on("private-message", ({from, to, message}) => {
    privateMessages.push({from, to, message, time: Date.now()});
    // Send to recipient and to admin (broadcast to all in demo)
    io.emit("private-message", {from, to, message, time: Date.now()});
  });

  // Contact admin/feedback
  socket.on("feedback", ({from, category, message}) => {
    feedbacks.push({from, category, message, time: Date.now()});
    io.emit("admin-feedback", {from, category, message, time: Date.now()});
  });

  // Broadcast message from admin
  socket.on("broadcast", ({message}) => {
    adminBroadcasts.push({message, time: Date.now(), ip: userIp});
    io.emit("broadcast", {message, time: Date.now()});
  });

  // Dashboard data request
  socket.on("dashboard-request", () => {
    socket.emit("dashboard-data", {
      members: users,
      broadcasts: adminBroadcasts,
      feedbacks,
      privateMessages
    });
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("user-list", users);
  });
});

// Fallback route
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log("CASPER Server running on port", PORT));
