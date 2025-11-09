Real-Time Collaborative Canvas

A multi-user, real-time drawing application built with Node.js, Express, Socket.io, and vanilla JavaScript. It allows multiple users to draw together simultaneously on a single, global canvas.

Features

Real-time Drawing: See other users' strokes appear on your canvas instantly.

Drawing Tools: A smooth-drawing brush and a functional eraser.

Tool Options: Adjustable stroke color and width.

Global Undo/Redo: Undo or redo the last strokes drawn by anyone, keeping all clients in sync.

Clear Canvas: A button to clear the entire canvas for everyone.

Live User List: See a list of all users currently connected to the canvas.

Real-Time Cursors: See other users' cursors moving on the canvas.

Mobile Touch Support: Fully functional on mobile and tablet devices.

Responsive UI: Adapts to desktop and mobile screen sizes.

How to Test (Live Demo)

The easiest way to test the real-time features is with the live demo link.

Open the Live Demo:

https://collaborative-canvas-lb64.onrender.com/

Open a Second Window:

Open the same link in a second browser window (or an incognito window).

Test:

Arrange the windows side-by-side.

Draw in one window. You will see it appear in the other, along with the other user in the "Online Users" list and their live cursor.

Test the "Undo," "Redo," and "Clear" buttons to see them sync globally.

Running Locally

If you want to run the project on your own machine:

Clone the repository:

git clone [https://github.com/ramakrishnakola507/collaborative-canvas.git](https://github.com/ramakrishnakola507/collaborative-canvas.git)
cd collaborative-canvas


Install dependencies:

npm install


Start the server:

npm start


Open the application:

Open your browser and navigate to http://localhost:3001.

You can follow the same multi-window testing steps as the Live Demo.

Known Limitations

Single Global Canvas: This application currently supports a single, global canvas. All users who open the app are connected to the same drawing board.

Canvas Resizing: If the browser window is resized, the local canvas clears. A better implementation would re-request the drawing history from the server.

Undo Performance: The Undo/Redo feature works by having the server send the entire drawing history to all clients for a full redraw. This is simple and guarantees consistency but could become slow with thousands of strokes.

State Persistence: Drawing history is stored in server memory. If the server (on Render or locally) restarts, all drawings are lost.
