// --- WebSocket Connection ---
const socket = io();
window.socket = socket; // Make it globally accessible for other scripts

// Map to store remote user drawing states
const remoteDrawers = new Map();

// --- Event Listeners (Receiving from Server) ---

// Handle all remote drawing events
socket.on('draw-from-server', ({ type, data, userId }) => {
  const { x, y, color, width } = data;
  const ctx = window.canvasCtx;

  switch (type) {
    case 'start':
      // Store the state for this user
      remoteDrawers.set(userId, { color, width });
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      break;
    case 'move':
      // Only draw if we have a state for this user
      if (remoteDrawers.has(userId)) {
        // Apply their specific styles
        const userState = remoteDrawers.get(userId);
        ctx.strokeStyle = userState.color;
        ctx.lineWidth = userState.width;
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      break;
    case 'end':
      if (remoteDrawers.has(userId)) {
        ctx.closePath();
        remoteDrawers.delete(userId); // Clear state
      }
      break;
  }
});

// Handle global state updates (Undo/Redo/Resize)
socket.on('force-redraw', (operationStack) => {
  window.redrawAll(operationStack);
});

// Handle global clear
socket.on('clear-canvas', () => {
  window.clearLocalCanvas();
});

// --- User Management Listeners (Handled in main.js) ---
socket.on('user-connected', ({ currentUser, allUsers }) => {
  window.handleUserConnected(currentUser, allUsers);
});

socket.on('user-joined', (user) => {
  window.handleUserJoined(user);
});

socket.on('user-disconnected', (userId) => {
  window.handleUserDisconnected(userId);
});

// --- Cursor Update Listener (Handled in main.js) ---
socket.on('cursor-update', ({ x, y, userId }) => {
  window.updateRemoteCursor(x, y, userId);
});