// --- Canvas State ---
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#FFFFFF';
let currentWidth = 5;

// --- Canvas Setup ---
function resizeCanvas() {
  const mainContent = document.getElementById('main-content');
  canvas.width = mainContent.clientWidth;
  canvas.height = mainContent.clientHeight;
  // Note: Resizing clears the canvas. We must request a redraw.
  if (window.socket) {
    window.socket.emit('request-redraw'); // Will be handled in Part 3
  }
}

// Initial resize
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- Drawing Functions ---

function getMousePos(event) {
  // Adjust mouse coordinates to be relative to the canvas
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  let x = (event.clientX - rect.left) * scaleX;
  let y = (event.clientY - rect.top) * scaleY;
  
  // Handle touch events for mobile support (Bonus)
  if (event.touches && event.touches.length > 0) {
    x = (event.touches.clientX - rect.left) * scaleX;
    y = (event.touches.clientY - rect.top) * scaleY;
  }
  
  return { x, y };
}

function startDrawing(event) {
  isDrawing = true;
  const { x, y } = getMousePos(event);

  ctx.beginPath();
  ctx.moveTo(x, y);

  // Set styles based on the tool
  let drawColor = currentColor;
  if (currentTool === 'eraser') {
    drawColor = getComputedStyle(document.body).getPropertyValue('--bg-deep-space');
  }

  ctx.strokeStyle = drawColor;
  ctx.lineWidth = currentWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Notify server
  if (window.socket) {
    window.socket.emit('drawing-start', { 
      x, 
      y, 
      color: drawColor, 
      width: ctx.lineWidth 
    });
  }
  
  event.preventDefault();
}

function draw(event) {
  if (!isDrawing) return;
  const { x, y } = getMousePos(event);

  ctx.lineTo(x, y);
  ctx.stroke();
  
  // Notify server
  if (window.socket) {
    window.socket.emit('drawing-move', { x, y });
  }
  
  event.preventDefault();
}

function stopDrawing(event) {
  if (!isDrawing) return;
  isDrawing = false;
  ctx.closePath();
  
  // Notify server
  if (window.socket) {
    window.socket.emit('drawing-end');
  }
}

// --- Event Listeners ---
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Touch Events for Mobile (Bonus)
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

// --- Global Redraw Function (for Undo/Redo) ---
// This function is the core of the "Global Undo" solution.
// It will be called by the websocket when the server sends a new state.

function redrawAll(operationStack) {
  console.log('Force redrawing canvas with new state...');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const op of operationStack) {
    if (op.type === 'path') {
      ctx.beginPath();
      ctx.strokeStyle = op.color;
      ctx.lineWidth = op.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (op.points.length === 0) continue;
      
      ctx.moveTo(op.points.x, op.points.y);
      
      for (let i = 1; i < op.points.length; i++) {
        ctx.lineTo(op.points[i].x, op.points[i].y);
      }
      
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// --- Clear Canvas Function ---
function clearLocalCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Global accessors for other scripts ---
window.canvasCtx = ctx;
window.redrawAll = redrawAll;
window.clearLocalCanvas = clearLocalCanvas;
window.setTool = (tool) => { currentTool = tool; };
window.setColor = (color) => { currentColor = color; };
window.setWidth = (width) => { currentWidth = width; };