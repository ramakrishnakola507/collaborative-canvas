const roomManager = require('./drawing-state');

/**
 * Initializes all socket event listeners for room management
 * @param {object} io The Socket.io server instance
 */
function initializeSocket(io) {
    
    // This runs for every single user that connects
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        
        let currentRoom = null;
        const currentUserId = socket.id;

        // --- Room Management ---
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            currentRoom = roomId;

            roomManager.addUser(currentRoom, currentUserId);
            const history = roomManager.getHistory(currentRoom);
            
            // Send the entire drawing history to the new user
            socket.emit('loadHistory', history);

            // Notify others in the room about the new user
            broadcastUserList(roomId);
            console.log(`User ${currentUserId} joined room ${currentRoom}`);
        });

        // --- Drawing Events ---
        socket.on('drawing', (data) => {
            if (!currentRoom) return;
            // Broadcast this to everyone (except sender) for the real-time feel
            socket.to(currentRoom).emit('drawing', { ...data, userId: currentUserId });
        });

        socket.on('strokeEnd', (data) => {
            if (!currentRoom) return;
            // Add the completed stroke to the room's history
            roomManager.addStroke(currentRoom, data);
        });

        // --- Global Undo ---
        socket.on('undo', () => {
            if (!currentRoom) return;
            // Get the new, shorter history
            const newHistory = roomManager.undoStroke(currentRoom);
            // Send it to *everyone* in the room
            io.to(currentRoom).emit('redrawAll', newHistory);
        });

        // --- Clear Canvas ---
        socket.on('clearCanvas', () => {
            if (!currentRoom) return;
            roomManager.clearHistory(currentRoom);
            // Tell everyone in the room to clear their canvas
            io.to(currentRoom).emit('clearCanvas');
        });

        // --- Bonus: Cursor Tracking ---
        socket.on('cursorMove', (pos) => {
            if (!currentRoom) return;
            roomManager.updateCursor(currentRoom, currentUserId, pos);
            const users = roomManager.getUsers(currentRoom);
            // Broadcast all user positions to the room
            io.to(currentRoom).emit('userCursors', users);
        });

        // --- Disconnect ---
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${currentUserId}`);
            if (!currentRoom) return;

            // Remove user from the room
            roomManager.removeUser(currentRoom, currentUserId);

            // Notify room of the updated user list
            broadcastUserList(currentRoom);
            
            // Also clear their cursor
            const users = roomManager.getUsers(currentRoom);
            io.to(currentRoom).emit('userCursors', users);
        });

        /**
         * Helper to broadcast the current user list to a room
         * @param {string} roomId 
         */
        function broadcastUserList(roomId) {
            const userIds = roomManager.getUserIds(roomId);
            io.to(roomId).emit('updateUsers', userIds);
        }
    });
}

module.exports = {
    initializeSocket
};