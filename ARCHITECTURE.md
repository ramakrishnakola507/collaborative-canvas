Architecture Document

This document outlines the architecture, data flow, and key decisions for the real-time collaborative canvas application.

1. Data Flow Diagram

The data flow is centralized around the Node.js server, which acts as the single source of truth for all room states.

[User A Client] --- (mousedown, mousemove) ---> [Canvas.js] -- (onDraw) --> [Websocket.js]
     |                                                                           |
     |                                                                           | (emit 'drawing')
     |                                                                           V
[User B Client] <-- (on 'drawing') <-- [Websocket.js] <-- (broadcast) <-- [Node.js Server]
     |                                                                      (Room A)
     |                                                                           ^
(draws remote stroke)                                                        | (emit 'strokeEnd')
     |                                                                           |
[User A Client] --- (mouseup) ---> [Canvas.js] -- (onStrokeEnd) --> [Websocket.js]


User Draws (Local): User A moves their mouse. canvas.js captures this, draws it on User A's local canvas immediately (for responsiveness), and sends the stroke data via a callback.

Send Live Data: websocket.js receives this data and emits a 'drawing' event to the Node.js server.

Broadcast Live Data: The server receives the 'drawing' event and broadcasts it to everyone else in that specific room.

Receive Live Data: User B's websocket.js hears the 'drawing' event and tells its canvas.js to draw the partial stroke from User A.

User Finishes (Local): User A releases the mouse. canvas.js sends the complete stroke object via the onStrokeEnd callback.

Send Final Stroke: websocket.js emits a 'strokeEnd' event to the server.

Persist Stroke: The server receives 'strokeEnd' and pushes the complete stroke object onto the drawingHistory array for that room.

2. WebSocket Protocol

The protocol is event-based, with clients emitting events to the server and the server broadcasting events to clients within a specific room.

Client-to-Server Events

joinRoom (roomId): Sent when a user wants to join a room.

drawing (strokePart): Sent continuously while the user is drawing. strokePart is an object like { color, width, tool, points: [...] }. This is for live preview.

strokeEnd (stroke): Sent once when the user finishes a stroke. stroke is the complete stroke object. This is for history persistence.

undo (): Sent when the user clicks the "Undo" button.

clearCanvas (): Sent when the user clicks the "Clear" button.

cursorMove (pos): (Bonus) Sent on mousemove to update the user's cursor position. pos is { x, y }.

Server-to-Client Events

loadHistory (history): Sent only to the new user when they join a room. history is the full array of complete stroke objects for that room.

drawing (strokePart): Broadcast to all other users in the room. strokePart includes the userId of the drawer.

redrawAll (history): Broadcast to everyone in the room after an "Undo". This forces a complete canvas clear and redraw from the new, shorter history.

clearCanvas (): Broadcast to everyone in the room to clear their canvas.

updateUsers (users): (Bonus) Broadcast to everyone in the room when the user list changes. users is an array of userId strings.

userCursors (cursors): (Bonus) Broadcast to everyone in the room on a user's cursor move. cursors is an object: { userId: { id, pos: {x, y} }, ... }.

3. Undo/Redo Strategy

The assignment required a global undo, where an undo action from any user removes the last-drawn stroke, regardless of who drew it.

State: The server maintains a drawingHistory for each room, which is an array (stack) of complete stroke objects.

Action: When a client emits undo, the server performs rooms[roomId].history.pop().

Synchronization: After popping the stroke, the server emits a redrawAll event to every client in the room, sending the entire new history.

Client-side: Clients listen for redrawAll, clear their local canvas (ctx.clearRect()), and loop through the new history array, redrawing every single stroke.

Conflict Resolution: This strategy is the conflict resolution. There can be no conflict because the server is the single source of truth. By forcing a full redraw from the server's master list, all clients are guaranteed to be in the exact same state.

4. Performance & Optimizations

Local-First Drawing: The most important optimization. When a user draws, it appears on their own canvas instantly before any network traffic. This provides a fluid, responsive feel.

Live Data vs. History: We use two separate events for drawing. 'drawing' is for the live, real-time feel, broadcasting partial stroke data. 'strokeEnd' is for state persistence, sending the final, complete stroke to be saved.

Canvas Sizing: The canvas is sized based on its container and devicePixelRatio to ensure it is crisp on HiDPI (Retina) displays.

Event Throttling (Potential): The cursorMove event could be throttled (e.g., using requestAnimationFrame or a simple setTimeout delay) to reduce network spam. This was not implemented due to the time constraint but is a clear next step.