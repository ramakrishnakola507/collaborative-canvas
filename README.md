Real-Time Collaborative Canvas

This is a multi-user, real-time drawing application built with Node.js, Express, Socket.io, and vanilla JavaScript (HTML5 Canvas). It allows multiple users to join "rooms" and draw together simultaneously.

Features

Real-time Drawing: See other users' strokes as they draw.

Room System (Bonus): Create or join isolated drawing rooms.

Drawing Tools: Brush and eraser.

Tool Options: Adjustable stroke color and width.

Global Undo: The "Undo" button undoes the last stroke drawn by anyone in the room, keeping all users in sync.

Clear Canvas: A button to clear the entire canvas for everyone in the room.

User List: See who is currently in the room with you.

Real-Time Cursors (Bonus): See the cursors of other users moving on the canvas.

Mobile Touch Support (Bonus): Fully functional on mobile and tablet devices.

Responsive UI: Adapts to desktop and mobile screen sizes.

Time Spent

This project was built to meet a specific challenge. Total development time was approximately 2 hours.

Setup & Running

Clone the repository:

git clone [your-repo-url]
cd collaborative-canvas


Install dependencies:

npm install


Start the server:

npm start


Open the application:
Open your browser and navigate to http://localhost:3000.

How to Test (Multiple Users)

Open http://localhost:3000 in a browser window.

Enter a room name (e.g., "test-room") and click "Join".

Open a second browser window (or an incognito window) and navigate to http://localhost:3000 again.

Enter the same room name ("test-room") and click "Join".

Arrange the windows side-by-side.

You can now draw in one window and see it appear in real-time in the other. You will also see the user list update and the other user's cursor.

Known Limitations/Bugs

Canvas Resizing: If the browser window is resized, the canvas clears. The drawing history is not reapplied automatically (though a new user joining will still get the full history).

Undo Performance: The "Undo" feature works by having the server send the entire drawing history (minus one stroke) to all clients for a full redraw. This is simple and guarantees consistency, but it could become slow with a very complex drawing (thousands of strokes).

State Persistence: Drawing history is stored in server memory. If the server restarts, all drawings are lost.