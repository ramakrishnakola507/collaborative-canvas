const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const drawingState = require('./drawing-state');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3001;

// Serve the client-side files
const clientPath = path.join(__dirname, '../client');
app.use(express.static(clientPath));

// Simple in-memory storage for users
const users = new Map(); // Stores socket.id -> { id, name, color }

// --- WebSocket Connection Handling ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Assign a random name and color
  const userName = `User-${Math.floor(Math.random() * 1000)}`;
  const userColor = `hsl(${Math.floor(Math.random() * 360)}, 90%, 70%)`;
  
  const newUser = { id: socket.id, name: userName, color: userColor };
  users.set(socket.id, newUser);

  // Send to the new user: their info + the current list of all other users + canvas state
  socket.emit('user-connected', { 
    currentUser: newUser, 
    allUsers: Array.from(users.values()) 
  });
  socket.emit('force-redraw', drawingState.getStack()); // Send history to new user

  // Send to all *other* users: the new user's info
  socket.broadcast.emit('user-joined', newUser);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    users.delete(socket.id);
    io.emit('user-disconnected', socket.id); // Notify all clients
  });
  
  // --- Real-time Drawing & State Buffering ---
  
  // Buffer the 'move' events into a single operation
  let currentOperation = null;

  socket.on('drawing-start', (data) => {
    // Create a pending operation for this user
    currentOperation = {
      type: 'path',
      user: socket.id,
      color: data.color,
      width: data.width,
      points: [{ x: data.x, y: data.y }]
    };
    // Broadcast the start event for real-time feel
    socket.broadcast.emit('draw-from-server', { type: 'start', data, userId: socket.id });
  });

  socket.on('drawing-move', (data) => {
    if (currentOperation) {
      // Add points to the pending operation
      currentOperation.points.push({ x: data.x, y: data.y });
      // Broadcast the move event
      socket.broadcast.emit('draw-from-server', { type: 'move', data, userId: socket.id });
    }
  });

  socket.on('drawing-end', () => {
    if (currentOperation && currentOperation.points.length > 1) {
      // The operation is complete. Push it to the global state.
      drawingState.pushOperation(currentOperation);
    }
    currentOperation = null;
    // Broadcast the end event
    socket.broadcast.emit('draw-from-server', { type: 'end', data: {}, userId: socket.id });
  });

  // --- Global State Event Handlers ---

  socket.on('request-undo', () => {
    const undoneOp = drawingState.popOperation();
    if (undoneOp) {
      drawingState.pushRedo(undoneOp);
      // Broadcast the new, definitive state to EVERYONE
      io.emit('force-redraw', drawingState.getStack());
    }
  });

  socket.on('request-redo', () => {
    const redoneOp = drawingState.popRedo();
    if (redoneOp) {
      drawingState.pushOperation(redoneOp);
      // Broadcast the new, definitive state to EVERYONE
      io.emit('force-redraw', drawingState.getStack());
    }
  });

  socket.on('request-clear', () => {
    drawingState.clearAll();
    io.emit('clear-canvas');
  });

  // Handle client resizes or joins-in-progress
  socket.on('request-redraw', () => {
    socket.emit('force-redraw', drawingState.getStack());
  });

  // --- Cursor Handling ---
  socket.on('cursor-move', (data) => {
    socket.broadcast.emit('cursor-update', { x: data.x, y: data.y, userId: socket.id });
  });

});

// --- THIS IS THE COMPLETE, CORRECT CODE ---
// --- PASTE THIS AT THE BOTTOM OF server/server.js ---

const PORT = process.env.PORT || 3001;

server.listen({
    host: '0.0.0.0', // The fix for Render
    port: PORT      // The port variable
}, () => {
    console.log(`Server running on port ${PORT}`);
});