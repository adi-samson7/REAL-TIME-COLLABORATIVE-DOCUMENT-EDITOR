import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Document from './models/document.js';
import User from './models/user.js';
import Delta from 'quill-delta';

const app = express();
const server = http.createServer(app);

// Basic setup
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect('mongodb://localhost:27017/collaborative-docs')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io setup
const io = new Server(server, { 
  cors: { 
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});
const activeRooms = new Map();

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id, name: user.name }, 'your-secret-key', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, name } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, name: user.name }, 'your-secret-key', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// REST endpoint to fetch a document by roomId (used by Axios in TextEditor.js)
app.get('/api/documents/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ content: document.data });
  } catch (err) {
    console.error('Failed to fetch document:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  // Verify JWT and get user info
  let currentUser = null;
  try {
    const token = socket.handshake.query.token;
    const decoded = jwt.verify(token, 'your-secret-key');
    currentUser = {
      id: decoded.id,
      name: decoded.name
    };
    console.log(`Authenticated user: ${currentUser.name}`);
  } catch (err) {
    console.error('Authentication failed:', err.message);
    socket.disconnect();
    return;
  }

  // Room management
  socket.on('join-room', async (roomId) => {
    console.log(`${currentUser.name} joining room: ${roomId}`);
    
    // Leave previous room if exists
    if (socket.roomId) {
      socket.leave(socket.roomId);
      console.log(`Left previous room: ${socket.roomId}`);
    }

    // Join new room
    socket.join(roomId);
    socket.roomId = roomId;

    // Initialize room if doesn't exist
    if (!activeRooms.has(roomId)) {
      const doc = await Document.findOne({ _id: roomId }) || 
        new Document({ _id: roomId, data: { ops: [{ insert: '\n' }] } });
      activeRooms.set(roomId, { 
        users: new Map(),
        document: doc 
      });
    }

    // Add user to room
    activeRooms.get(roomId).users.set(socket.id, currentUser);
    
    // Send document to joining user
    socket.emit('document-loaded', activeRooms.get(roomId).document.data);
    
    // Broadcast updated user list to all in room
    io.to(roomId).emit('users-in-room', 
      Array.from(activeRooms.get(roomId).users.values())
    );
    
    console.log(`Room ${roomId} now has ${activeRooms.get(roomId).users.size} users`);
  });

  // Document editing handlers
  socket.on('send-changes', (delta) => {
  if (socket.roomId) {
    const room = activeRooms.get(socket.roomId);
    if (room) {
      // Apply delta to the in-memory document
      const currentData = room.document.data || { ops: [{ insert: '\n' }] };
      const updatedDelta = new Delta(currentData).compose(new Delta(delta));
      room.document.data = updatedDelta; // ⬅️ Update memory

      // Broadcast to others
      socket.to(socket.roomId).emit('receive-changes', delta);
    }
  }
});

  socket.on('save-document', async (content) => {
    if (socket.roomId) {
      try {
        const room = activeRooms.get(socket.roomId);
        if (room) {
          await Document.findOneAndUpdate(
            { _id: socket.roomId },
            { data: room.document.data, lastSaved: new Date() },
            { upsert: true, new: true }
          );
        }
        console.log(`Document ${socket.roomId} saved by ${currentUser.name}`);
      } catch (err) {
        console.error('Document save error:', err);
      }
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    console.log(`${currentUser?.name || 'Unknown user'} disconnected`);
    
    if (socket.roomId) {
      const room = activeRooms.get(socket.roomId);
      if (room) {
        room.users.delete(socket.id);
        
        if (room.users.size === 0) {
          activeRooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} closed (no users left)`);
        } else {
          io.to(socket.roomId).emit('users-in-room', 
            Array.from(room.users.values())
          );
          console.log(`User left room ${socket.roomId}, ${room.users.size} remaining`);
        }
      }
    }
  });
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});