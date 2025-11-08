// --- App State ---
let myInfo = null;
const remoteCursors = new Map();
const cursorLayer = document.getElementById('cursor-layer');
const userList = document.getElementById('user-list');

// --- Throttle Utility Function [68] ---
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// --- Sidebar Navigation  ---
const openNavBtn = document.getElementById('open-nav-btn');
const closeNavBtn = document.getElementById('close-nav-btn');
const sidebar = document.getElementById('user-sidebar');
const mainContent = document.getElementById('main-content');

openNavBtn.onclick = () => {
  sidebar.style.width = '250px';
  mainContent.style.marginLeft = '250px';
};
closeNavBtn.onclick = () => {
  sidebar.style.width = '0';
  mainContent.style.marginLeft = '0';
};

// --- Toolbar Event Listeners ---
const toolbar = document.getElementById('toolbar');

toolbar.addEventListener('click', (e) => {
  const button = e.target.closest('button.tool-button');
  if (button) {
    const tool = button.dataset.tool;

    // Handle tool selection
    if (tool === 'brush' || tool === 'eraser') {
      // Update active state
      toolbar.querySelector('.tool-button.active')?.classList.remove('active');
      button.classList.add('active');
      // Update canvas.js state
      window.setTool(tool);
    }
    
    // Handle actions
    if (tool === 'undo') {
      window.socket.emit('request-undo');
    }
    if (tool === 'redo') {
      window.socket.emit('request-redo');
    }
    if (tool === 'clear') {
      window.socket.emit('request-clear');
    }
  }

  // Handle swatch selection
  const swatch = e.target.closest('.swatch');
  if (swatch) {
    const color = swatch.dataset.color;
    // Update active state
    toolbar.querySelector('.swatch.active')?.classList.remove('active');
    swatch.classList.add('active');
    // Update canvas.js state
    window.setColor(color);
    // Also update the native picker's value
    document.getElementById('color-picker-native').value = color;
  }
});

// Handle native color picker
const nativeColorPicker = document.getElementById('color-picker-native');
nativeColorPicker.addEventListener('input', (e) => {
  const color = e.target.value;
  window.setColor(color);
  // De-select all swatches
  toolbar.querySelector('.swatch.active')?.classList.remove('active');
});

// Handle stroke width slider
const widthSlider = document.getElementById('stroke-width-slider');
widthSlider.addEventListener('input', (e) => {
  const width = e.target.value;
  window.setWidth(width);
});

// --- Cursor Tracking ---
const throttledEmitCursor = throttle((x, y) => {
  // We send coordinates relative to the main content area
  // to account for the sidebar
  const rect = mainContent.getBoundingClientRect();
  window.socket.emit('cursor-move', { 
    x: x - rect.left, 
    y: y - rect.top 
  });
}, 50); // Emit max 20 times/sec 

mainContent.addEventListener('mousemove', (e) => {
  throttledEmitCursor(e.clientX, e.clientY);
});

// --- Global Handlers (Called by websocket.js) ---

// Create a new user avatar in the sidebar
function createAvatarElement(user) {
  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'user-avatar';
  avatarDiv.id = `avatar-${user.id}`;
  avatarDiv.title = user.name;
  
  const initialsDiv = document.createElement('div');
  initialsDiv.className = 'avatar-initials';
  initialsDiv.style.backgroundColor = user.color;
  initialsDiv.textContent = user.name.substring(0, 2).toUpperCase();
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'avatar-name';
  nameSpan.textContent = user.name;
  
  const statusSpan = document.createElement('span');
  statusSpan.className = 'status-dot online';

  avatarDiv.appendChild(initialsDiv);
  avatarDiv.appendChild(nameSpan);
  avatarDiv.appendChild(statusSpan);
  
  return avatarDiv;
}

// Create a new remote cursor element 
function createCursorElement(user) {
  const cursorDiv = document.createElement('div');
  cursorDiv.className = 'remote-cursor';
  cursorDiv.id = `cursor-${user.id}`;
  
  // Cursor SVG (the pointer icon)
  const cursorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  cursorSvg.setAttribute('viewBox', '0 0 24 24');
  cursorSvg.setAttribute('width', '24');
  cursorSvg.setAttribute('height', '24');
  cursorSvg.innerHTML = `<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="${user.color}" />`;
  
  // Name Label [67]
  const labelDiv = document.createElement('div');
  labelDiv.className = 'cursor-label';
  labelDiv.style.backgroundColor = user.color;
  labelDiv.textContent = user.name;

  cursorDiv.appendChild(cursorSvg);
  cursorDiv.appendChild(labelDiv);
  
  return cursorDiv;
}

window.handleUserConnected = (currentUser, allUsers) => {
  myInfo = currentUser;
  userList.innerHTML = ''; // Clear list
  cursorLayer.innerHTML = ''; // Clear cursors
  remoteCursors.clear();
  
  for (const user of allUsers) {
    userList.appendChild(createAvatarElement(user));
    if (user.id!== myInfo.id) {
      const cursorEl = createCursorElement(user);
      cursorLayer.appendChild(cursorEl);
      remoteCursors.set(user.id, cursorEl);
    }
  }
};

window.handleUserJoined = (user) => {
  userList.appendChild(createAvatarElement(user));
  const cursorEl = createCursorElement(user);
  cursorLayer.appendChild(cursorEl);
  remoteCursors.set(user.id, cursorEl);
};

window.handleUserDisconnected = (userId) => {
  document.getElementById(`avatar-${userId}`)?.remove();
  remoteCursors.get(userId)?.remove();
  remoteCursors.delete(userId);
};

window.updateRemoteCursor = (x, y, userId) => {
  const cursor = remoteCursors.get(userId);
  if (cursor) {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }
};