// Dashboard functionality
let socket = null;
let currentTerminal = null;
let currentTerminalData = null;
let term = null;
let fitAddon = null;

// Auth check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || !user.username) {
  window.location.href = '/login.html';
}

// Display user info
document.getElementById('currentUser').textContent = user.username;
const roleElement = document.getElementById('userRole');
roleElement.textContent = user.role;
if (user.role === 'admin') {
  roleElement.classList.add('admin');
  document.getElementById('adminPanelBtn').style.display = 'block';
}

// Initialize Socket.IO connection
function initializeSocket() {
  socket = io({
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('error', (data) => {
    console.error('Socket error:', data.message);
    alert('Error: ' + data.message);
  });

  socket.on('terminal-output', (data) => {
    if (data.terminalId === currentTerminal && term) {
      // Don't clear, just write new output
      const lines = data.output.split('\n');
      term.clear();
      term.write(lines.join('\r\n'));
    }
  });

  socket.on('terminal-attached', (data) => {
    console.log('Attached to terminal:', data.terminalId);
    document.getElementById('clearBtn').disabled = false;
    document.getElementById('reconnectBtn').disabled = false;
  });

  socket.on('command-sent', (data) => {
    console.log('Command sent:', data.command);
  });
}

// Load terminals
async function loadTerminals() {
  try {
    const response = await fetch('/api/terminals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }
      throw new Error('Failed to load terminals');
    }

    const terminals = await response.json();
    const terminalsList = document.getElementById('terminalsList');
    terminalsList.innerHTML = '';

    if (terminals.length === 0) {
      terminalsList.innerHTML = '<li style="padding: 10px; color: #999;">No terminals available</li>';
      return;
    }

    terminals.forEach(terminal => {
      const li = document.createElement('li');
      li.className = 'terminal-item';
      li.dataset.terminalId = terminal.id;
      li.innerHTML = `
        <span class="icon">${terminal.icon || '🖥️'}</span>
        <div class="info">
          <span class="name">${terminal.name}</span>
          <span class="description">${terminal.description || ''}</span>
        </div>
      `;

      li.addEventListener('click', () => selectTerminal(terminal));
      terminalsList.appendChild(li);
    });
  } catch (error) {
    console.error('Load terminals error:', error);
  }
}

// Select terminal
function selectTerminal(terminal) {
  // Update UI
  document.querySelectorAll('.terminal-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-terminal-id="${terminal.id}"]`).classList.add('active');

  document.getElementById('terminalTitle').textContent = terminal.name;

  // Detach from previous terminal
  if (currentTerminal && currentTerminal !== terminal.id) {
    socket.emit('detach-terminal', { terminalId: currentTerminal });
  }

  currentTerminal = terminal.id;
  currentTerminalData = terminal;

  // Update control buttons based on terminal config
  updateControlButtons(terminal);

  // Initialize xterm.js
  initializeTerminal();

  // Attach to terminal
  socket.emit('attach-terminal', { terminalId: terminal.id });

  // Show input
  document.getElementById('terminalInput').style.display = 'flex';
}

// Update control buttons visibility
function updateControlButtons(terminal) {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const restartBtn = document.getElementById('restartBtn');
  const gitPullBtn = document.getElementById('gitPullBtn');

  // Enable/disable buttons based on config
  startBtn.disabled = !terminal.startCommand;
  stopBtn.disabled = false; // Always allow stop (will use Ctrl+C if no command)
  restartBtn.disabled = !(terminal.restartCommand || (terminal.stopCommand || terminal.startCommand));
  
  // Show git pull button only if terminal has a repo
  if (terminal.hasGitRepo && terminal.startCommand) {
    gitPullBtn.style.display = 'inline-flex';
    gitPullBtn.disabled = false;
  } else {
    gitPullBtn.style.display = 'none';
  }
}

// Initialize xterm.js terminal
function initializeTerminal() {
  const terminalContent = document.getElementById('terminalContent');
  terminalContent.innerHTML = '<div id="terminal"></div>';

  term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    theme: {
      background: '#121212',
      foreground: '#ffffff',
      cursor: '#4CAF50'
    },
    rows: 30,
    convertEol: true
  });

  fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();

  // Buffer for current line input
  let currentLine = '';

  // Handle key input in terminal - disabled, use bottom input instead
  // Users should use the command input field at the bottom

  // Handle terminal resize
  window.addEventListener('resize', () => {
    if (term && fitAddon) {
      fitAddon.fit();
    }
  });
}

// Send command
function sendCommand() {
  const input = document.getElementById('commandInput');
  const command = input.value.trim();

  if (!command || !currentTerminal) return;

  socket.emit('send-command', {
    terminalId: currentTerminal,
    command: command
  });

  input.value = '';
}

// Event listeners
document.getElementById('sendBtn').addEventListener('click', sendCommand);

document.getElementById('commandInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendCommand();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    // Auto-complete could be added here in the future
    // For now, just insert tab character (useful for some commands)
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.substring(0, start) + '\t' + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (term) {
    term.clear();
  }
});

document.getElementById('reconnectBtn').addEventListener('click', () => {
  if (currentTerminal) {
    socket.emit('detach-terminal', { terminalId: currentTerminal });
    setTimeout(() => {
      socket.emit('attach-terminal', { terminalId: currentTerminal });
    }, 500);
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

document.getElementById('adminPanelBtn').addEventListener('click', () => {
  window.location.href = '/admin.html';
});

// Control buttons
document.getElementById('startBtn').addEventListener('click', async () => {
  if (!currentTerminal) return;
  
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Starting...';
  
  try {
    const response = await fetch('/api/terminal/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terminalId: currentTerminal })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Server started successfully');
    } else {
      alert('❌ ' + (data.error || 'Failed to start server'));
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.disabled = !currentTerminalData?.startCommand;
    btn.textContent = '▶️ Start';
  }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
  if (!currentTerminal) return;
  
  if (!confirm('Are you sure you want to stop the server?')) return;
  
  const btn = document.getElementById('stopBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Stopping...';
  
  try {
    const response = await fetch('/api/terminal/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terminalId: currentTerminal })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Server stopped successfully');
    } else {
      alert('❌ ' + (data.error || 'Failed to stop server'));
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⏹️ Stop';
  }
});

document.getElementById('restartBtn').addEventListener('click', async () => {
  if (!currentTerminal) return;
  
  if (!confirm('Are you sure you want to restart the server?')) return;
  
  const btn = document.getElementById('restartBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Restarting...';
  
  try {
    const response = await fetch('/api/terminal/restart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terminalId: currentTerminal })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Server restarted successfully');
    } else {
      alert('❌ ' + (data.error || 'Failed to restart server'));
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.disabled = !(currentTerminalData?.restartCommand || (currentTerminalData?.stopCommand || currentTerminalData?.startCommand));
    btn.textContent = '🔄 Restart';
  }
});

document.getElementById('gitPullBtn').addEventListener('click', async () => {
  if (!currentTerminal) return;
  
  if (!confirm('This will stop the server, pull latest changes, and restart. Continue?')) return;
  
  const btn = document.getElementById('gitPullBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Updating...';
  
  try {
    const response = await fetch('/api/terminal/git-pull-restart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ terminalId: currentTerminal })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('✅ Git pulled and server restarted successfully');
    } else {
      alert('❌ ' + (data.error || 'Failed to pull and restart'));
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Pull & Restart';
  }
});

// Initialize
initializeSocket();
loadTerminals();
