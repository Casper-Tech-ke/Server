const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection (use MongoDB Atlas for Render deployment)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/caspertech';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Models
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    ip: String,
    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    status: { type: String, default: 'offline' },
    isBlocked: { type: Boolean, default: false },
    blockedBy: String
});

const MessageSchema = new mongoose.Schema({
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    ip: String,
    room: { type: String, default: 'global' },
    type: { type: String, default: 'public' }, // public, private, group
    recipient: String // for private messages
});

const AIHistorySchema = new mongoose.Schema({
    userId: String,
    sessionId: String,
    messages: [{
        role: { type: String, enum: ['user', 'ai'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
        aiType: { type: String, enum: ['david', 'nexoracle'] }
    }],
    createdAt: { type: Date, default: Date.now }
});

const AdminMessageSchema = new mongoose.Schema({
    userId: String,
    userMessage: String,
    adminReply: String,
    status: { type: String, default: 'pending' }, // pending, replied
    timestamp: { type: Date, default: Date.now },
    conversationId: String
});

const BroadcastSchema = new mongoose.Schema({
    message: String,
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number, default: 5000 }
});

const AdSchema = new mongoose.Schema({
    content: String,
    imageUrl: String,
    duration: { type: Number, default: 5000 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);
const AIHistory = mongoose.model('AIHistory', AIHistorySchema);
const AdminMessage = mongoose.model('AdminMessage', AdminMessageSchema);
const Broadcast = mongoose.model('Broadcast', BroadcastSchema);
const Ad = mongoose.model('Ad', AdSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'casper_tech_secret_key';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Routes
// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const ip = req.ip;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            username,
            email,
            password: hashedPassword,
            ip
        });

        await user.save();
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const ip = req.ip;

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: 'Account blocked' });
        }

        // Update user status
        user.lastActive = new Date();
        user.status = 'online';
        user.ip = ip;
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/admin-login', async (req, res) => {
    try {
        const { password } = req.body;
        if (password !== 'casper11') {
            return res.status(400).json({ error: 'Invalid admin password' });
        }

        const token = jwt.sign({ id: 'admin', username: 'admin', isAdmin: true }, JWT_SECRET);
        res.json({ token, isAdmin: true });
    } catch (error) {
        res.status(500).json({ error: 'Admin login failed' });
    }
});

// Chat Routes
app.get('/api/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({ room: 'global' })
            .sort({ timestamp: -1 })
            .limit(50)
            .reverse();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const users = await User.find({}, 'username status lastActive');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// AI Chat Routes
app.get('/api/ai-history/:sessionId', verifyToken, async (req, res) => {
    try {
        const history = await AIHistory.findOne({ 
            userId: req.user.id, 
            sessionId: req.params.sessionId 
        });
        res.json(history || { messages: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch AI history' });
    }
});

app.post('/api/ai-chat', verifyToken, async (req, res) => {
    try {
        const { message, sessionId, aiType } = req.body;
        
        // Save user message
        let history = await AIHistory.findOne({ userId: req.user.id, sessionId });
        if (!history) {
            history = new AIHistory({
                userId: req.user.id,
                sessionId,
                messages: []
            });
        }

        history.messages.push({
            role: 'user',
            content: message,
            aiType
        });

        // Mock AI response (replace with actual AI API calls)
        let aiResponse;
        try {
            if (aiType === 'david') {
                // Call David Cyril Tech AI API
                const response = await fetch(`https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(message)}`);
                const data = await response.json();
                aiResponse = data.result || 'Sorry, I could not process your request.';
            } else {
                // Call NexOracle AI API
                const response = await fetch(`https://api.nexoracle.com/ai/chatgpt?apikey=851c4eaee30bb1d2fc&prompt=${encodeURIComponent(message)}`);
                const data = await response.json();
                aiResponse = data.result || 'Sorry, I could not process your request.';
            }
        } catch (error) {
            aiResponse = 'AI service is currently unavailable. Please try again later.';
        }

        history.messages.push({
            role: 'ai',
            content: aiResponse,
            aiType
        });

        await history.save();
        res.json({ response: aiResponse });
    } catch (error) {
        res.status(500).json({ error: 'AI chat failed' });
    }
});

// Admin Routes
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const totalUsers = await User.countDocuments();
        const onlineUsers = await User.countDocuments({ status: 'online' });
        const totalMessages = await Message.countDocuments();
        const pendingAdminMessages = await AdminMessage.countDocuments({ status: 'pending' });

        res.json({ totalUsers, onlineUsers, totalMessages, pendingAdminMessages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/api/admin/messages', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const messages = await AdminMessage.find().sort({ timestamp: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin messages' });
    }
});

app.post('/api/admin/reply', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const { messageId, reply } = req.body;
        const adminMessage = await AdminMessage.findById(messageId);
        if (!adminMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        adminMessage.adminReply = reply;
        adminMessage.status = 'replied';
        await adminMessage.save();

        // Emit to user if online
        io.to(adminMessage.userId).emit('adminReply', {
            conversationId: adminMessage.conversationId,
            reply,
            timestamp: new Date()
        });

        res.json({ message: 'Reply sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

app.post('/api/admin/block-user', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const { userId } = req.body;
        await User.findByIdAndUpdate(userId, { 
            isBlocked: true, 
            blockedBy: req.user.username 
        });
        res.json({ message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to block user' });
    }
});

app.post('/api/admin/broadcast', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const { message, duration = 5000 } = req.body;
        const broadcast = new Broadcast({ message, duration });
        await broadcast.save();

        // Emit to all connected users
        io.emit('broadcast', { message, duration });
        res.json({ message: 'Broadcast sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send broadcast' });
    }
});

app.post('/api/admin/create-ad', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    
    try {
        const { content, imageUrl, duration = 5000 } = req.body;
        const ad = new Ad({ content, imageUrl, duration });
        await ad.save();

        // Emit to all connected users
        io.emit('newAd', { content, imageUrl, duration });
        res.json({ message: 'Ad created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ad' });
    }
});

// Contact Admin
app.post('/api/contact-admin', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;
        const conversationId = uuidv4();
        
        const adminMessage = new AdminMessage({
            userId: req.user.id,
            userMessage: message,
            conversationId
        });
        
        await adminMessage.save();
        res.json({ message: 'Message sent to admin', conversationId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Socket.io handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (data) => {
        socket.username = data.username;
        socket.join('global');
        socket.broadcast.emit('userJoined', { username: data.username });
    });

    socket.on('sendMessage', async (data) => {
        try {
            const message = new Message({
                username: socket.username,
                message: data.message,
                ip: socket.request.connection.remoteAddress,
                room: data.room || 'global'
            });
            
            await message.save();
            
            if (data.room === 'global') {
                io.emit('newMessage', {
                    username: socket.username,
                    message: data.message,
                    timestamp: message.timestamp
                });
            } else {
                // Private message
                io.to(data.room).emit('newMessage', {
                    username: socket.username,
                    message: data.message,
                    timestamp: message.timestamp
                });
            }
        } catch (error) {
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('joinPrivateChat', (data) => {
        const room = [socket.username, data.otherUser].sort().join('-');
        socket.join(room);
        socket.emit('joinedPrivateChat', { room });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            socket.broadcast.emit('userLeft', { username: socket.username });
        }
        console.log('User disconnected:', socket.id);
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/ai-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ai-chat.html'));
});

app.get('/private-chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'private-chat.html'));
});

app.get('/contact-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact-admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`CASPER TECH Server running on port ${PORT}`);
});
