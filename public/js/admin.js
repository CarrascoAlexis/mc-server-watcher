// Admin panel functionality
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Auth and role check
if (!token || !user.username || user.role !== 'admin') {
  window.location.href = '/dashboard.html';
}

document.getElementById('currentUser').textContent = user.username;

// State
let allTerminals = [];
let editingUserId = null;
let editingTerminalIndex = null;
let allStartupTasks = [];
let editingStartupTaskId = null;

// Tab switching
document.querySelectorAll('.admin-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = e.target.dataset.tab;

    // Update nav
    document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');

    // Update tabs
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
  });
});

// Load users
async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load users');
    }

    const users = await response.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.username}</td>
        <td><span class="badge ${u.role === 'admin' ? 'admin' : ''}">${u.role}</span></td>
        <td>${u.terminals.join(', ') || 'None'}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td class="table-actions">
          <button class="btn btn-small btn-secondary" onclick="editUser('${u.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteUser('${u.id}', '${u.username}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Load users error:', error);
    alert('Failed to load users');
  }
}

// Load terminals config
async function loadTerminalsConfig() {
  try {
    const response = await fetch('/api/admin/terminals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load terminals');
    }

    allTerminals = await response.json();
    const container = document.getElementById('terminalsConfigList');
    container.innerHTML = '';

    if (allTerminals.length === 0) {
      container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No terminals configured yet. Click "+ Create Terminal" to add one.</p>';
      return;
    }

    allTerminals.forEach((terminal, index) => {
      const card = document.createElement('div');
      card.className = 'config-card';
      card.innerHTML = `
        <h4>${terminal.icon || '🖥️'} ${terminal.name}</h4>
        <div class="details">
          <strong>ID:</strong> ${terminal.id}<br>
          <strong>Description:</strong> ${terminal.description || 'N/A'}<br>
          <strong>Session Name:</strong> ${terminal.sessionName || terminal.id}<br>
          <strong>Working Directory:</strong> ${terminal.workingDirectory || 'N/A'}<br>
          <strong>Initial Command:</strong> ${terminal.initialCommand || 'None'}
        </div>
        <div class="table-actions" style="margin-top: 15px;">
          <button class="btn btn-small btn-secondary" onclick="editTerminal(${index})">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteTerminal(${index}, '${terminal.name}')">Delete</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Update checkboxes in user modal
    updateTerminalsCheckboxes();
  } catch (error) {
    console.error('Load terminals error:', error);
  }
}

// Update terminals checkboxes
function updateTerminalsCheckboxes() {
  const container = document.getElementById('terminalsCheckboxes');
  container.innerHTML = '';

  if (allTerminals.length === 0) {
    container.innerHTML = '<p style="color: #999;">No terminals available</p>';
    return;
  }

  allTerminals.forEach(terminal => {
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    div.innerHTML = `
      <input type="checkbox" id="term_${terminal.id}" value="${terminal.id}">
      <label for="term_${terminal.id}">${terminal.icon || '🖥️'} ${terminal.name}</label>
    `;
    container.appendChild(div);
  });
}

// Create user modal
function showCreateUserModal() {
  editingUserId = null;
  document.getElementById('modalTitle').textContent = 'Create User';
  document.getElementById('userId').value = '';
  document.getElementById('userForm').reset();
  document.getElementById('modalPassword').required = true;
  
  // Uncheck all terminals
  document.querySelectorAll('#terminalsCheckboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  document.getElementById('userModal').classList.add('active');
}

// Edit user
async function editUser(userId) {
  try {
    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const users = await response.json();
    const user = users.find(u => u.id === userId);

    if (!user) {
      alert('User not found');
      return;
    }

    editingUserId = userId;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = userId;
    document.getElementById('modalUsername').value = user.username;
    document.getElementById('modalPassword').value = '';
    document.getElementById('modalPassword').required = false;
    document.getElementById('modalRole').value = user.role;

    // Check user's terminals
    document.querySelectorAll('#terminalsCheckboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = user.terminals.includes(cb.value);
    });

    document.getElementById('userModal').classList.add('active');
  } catch (error) {
    console.error('Edit user error:', error);
    alert('Failed to load user data');
  }
}

// Delete user
async function deleteUser(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert('User deleted successfully');
      loadUsers();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('Failed to delete user');
  }
}

// Save user
document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('modalUsername').value;
  const password = document.getElementById('modalPassword').value;
  const role = document.getElementById('modalRole').value;

  // Get selected terminals
  const terminals = [];
  document.querySelectorAll('#terminalsCheckboxes input[type="checkbox"]:checked').forEach(cb => {
    terminals.push(cb.value);
  });

  const userData = {
    username,
    role,
    terminals
  };

  // Only include password if it's filled
  if (password) {
    userData.password = password;
  }

  try {
    let response;
    
    if (editingUserId) {
      // Update user
      response = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
    } else {
      // Create user
      if (!password) {
        alert('Password is required for new users');
        return;
      }
      
      response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
    }

    const data = await response.json();

    if (response.ok) {
      alert(editingUserId ? 'User updated successfully' : 'User created successfully');
      closeModal();
      loadUsers();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Save user error:', error);
    alert('Failed to save user');
  }
});

// Close modal
function closeModal() {
  document.getElementById('userModal').classList.remove('active');
  document.getElementById('userForm').reset();
  editingUserId = null;
}

// Event listeners
document.getElementById('createUserBtn').addEventListener('click', showCreateUserModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

document.getElementById('reloadTerminalsBtn').addEventListener('click', loadTerminalsConfig);

document.getElementById('backToDashboard').addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/login.html';
});

// Close modal on outside click
document.getElementById('userModal').addEventListener('click', (e) => {
  if (e.target.id === 'userModal') {
    closeModal();
  }
});

document.getElementById('terminalModal').addEventListener('click', (e) => {
  if (e.target.id === 'terminalModal') {
    closeTerminalModal();
  }
});

// Terminal management functions
function showCreateTerminalModal() {
  editingTerminalIndex = null;
  document.getElementById('terminalModalTitle').textContent = 'Create Terminal';
  document.getElementById('terminalForm').reset();
  document.getElementById('terminalEditIndex').value = '';
  document.getElementById('terminalModal').classList.add('active');
}

function editTerminal(index) {
  const terminal = allTerminals[index];
  if (!terminal) return;

  editingTerminalIndex = index;
  document.getElementById('terminalModalTitle').textContent = 'Edit Terminal';
  document.getElementById('terminalEditIndex').value = index;
  document.getElementById('terminalId').value = terminal.id;
  document.getElementById('terminalName').value = terminal.name;
  document.getElementById('terminalDescription').value = terminal.description || '';
  document.getElementById('terminalSessionName').value = terminal.sessionName || '';
  document.getElementById('terminalWorkDir').value = terminal.workingDirectory || '';
  document.getElementById('terminalInitCmd').value = terminal.initialCommand || '';
  document.getElementById('terminalIcon').value = terminal.icon || '';

  document.getElementById('terminalModal').classList.add('active');
}

async function deleteTerminal(index, name) {
  if (!confirm(`Are you sure you want to delete terminal "${name}"?\n\nUsers with access to this terminal will lose it.`)) {
    return;
  }

  try {
    // Remove from array
    const updatedTerminals = [...allTerminals];
    updatedTerminals.splice(index, 1);

    const response = await fetch('/api/admin/terminals', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTerminals)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Terminal deleted successfully');
      loadTerminalsConfig();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Delete terminal error:', error);
    alert('Failed to delete terminal');
  }
}

function closeTerminalModal() {
  document.getElementById('terminalModal').classList.remove('active');
  document.getElementById('terminalForm').reset();
  editingTerminalIndex = null;
}

// Terminal form submission
document.getElementById('terminalForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const terminalData = {
    id: document.getElementById('terminalId').value.trim(),
    name: document.getElementById('terminalName').value.trim(),
    description: document.getElementById('terminalDescription').value.trim(),
    sessionName: document.getElementById('terminalSessionName').value.trim(),
    workingDirectory: document.getElementById('terminalWorkDir').value.trim(),
    initialCommand: document.getElementById('terminalInitCmd').value.trim(),
    icon: document.getElementById('terminalIcon').value.trim()
  };

  // Validate ID format
  if (!/^[a-z0-9-]+$/.test(terminalData.id)) {
    alert('ID must contain only lowercase letters, numbers, and hyphens');
    return;
  }

  try {
    let updatedTerminals = [...allTerminals];

    if (editingTerminalIndex !== null) {
      // Update existing terminal
      updatedTerminals[editingTerminalIndex] = terminalData;
    } else {
      // Check if ID already exists
      if (updatedTerminals.find(t => t.id === terminalData.id)) {
        alert('A terminal with this ID already exists');
        return;
      }
      // Add new terminal
      updatedTerminals.push(terminalData);
    }

    const response = await fetch('/api/admin/terminals', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTerminals)
    });

    const data = await response.json();

    if (response.ok) {
      alert(editingTerminalIndex !== null ? 'Terminal updated successfully' : 'Terminal created successfully');
      closeTerminalModal();
      loadTerminalsConfig();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Save terminal error:', error);
    alert('Failed to save terminal');
  }
});

document.getElementById('createTerminalBtn').addEventListener('click', showCreateTerminalModal);
document.getElementById('closeTerminalModal').addEventListener('click', closeTerminalModal);
document.getElementById('cancelTerminalBtn').addEventListener('click', closeTerminalModal);

// Startup Tasks Management
async function loadStartupTasks() {
  try {
    const response = await fetch('/api/admin/startup-tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load startup tasks');
    }

    allStartupTasks = await response.json();
    const tbody = document.querySelector('#startupTasksTable tbody');
    tbody.innerHTML = '';

    if (allStartupTasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No startup tasks configured yet.</td></tr>';
      return;
    }

    allStartupTasks.forEach((task, index) => {
      const statusBadge = task.active 
        ? '<span class="badge" style="background: #4CAF50;">Running</span>'
        : '<span class="badge" style="background: #f44336;">Stopped</span>';
      
      const enabledBadge = task.enabled
        ? '<span class="badge">Enabled</span>'
        : '<span class="badge" style="background: #999;">Disabled</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${task.name}</strong></td>
        <td style="font-family: monospace; font-size: 12px;">${task.command}</td>
        <td style="font-size: 12px;">${task.workingDirectory}</td>
        <td>${enabledBadge}</td>
        <td>${statusBadge}</td>
        <td class="table-actions">
          ${task.active 
            ? `<button class="btn btn-small btn-danger" onclick="controlService('${task.name}', 'stop')">Stop</button>`
            : `<button class="btn btn-small" style="background: #4CAF50; color: white;" onclick="controlService('${task.name}', 'start')">Start</button>`
          }
          <button class="btn btn-small btn-secondary" onclick="controlService('${task.name}', 'restart')">Restart</button>
          <button class="btn btn-small btn-secondary" onclick="viewServiceFile('${task.name}', ${index})">View Config</button>
          <button class="btn btn-small btn-secondary" onclick="editStartupTask(${index})">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteStartupTask(${index}, '${task.name}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Load startup tasks error:', error);
  }
}

function showCreateStartupTaskModal() {
  editingStartupTaskId = null;
  document.getElementById('startupTaskModalTitle').textContent = 'Create Startup Task';
  document.getElementById('startupTaskForm').reset();
  document.getElementById('startupTaskEditId').value = '';
  document.getElementById('taskEnabled').checked = true;
  document.getElementById('startupTaskModal').classList.add('active');
}

function editStartupTask(index) {
  const task = allStartupTasks[index];
  if (!task) return;

  editingStartupTaskId = index;
  document.getElementById('startupTaskModalTitle').textContent = 'Edit Startup Task';
  document.getElementById('startupTaskEditId').value = index;
  document.getElementById('taskName').value = task.name;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskCommand').value = task.command;
  document.getElementById('taskWorkDir').value = task.workingDirectory;
  document.getElementById('taskUser').value = task.user || '';
  document.getElementById('taskRestartPolicy').value = task.restartPolicy || 'always';
  document.getElementById('taskEnabled').checked = task.enabled !== false;

  document.getElementById('startupTaskModal').classList.add('active');
}

async function deleteStartupTask(index, name) {
  if (!confirm(`Are you sure you want to delete the startup task "${name}"?\n\nNote: This will not remove the systemd service. You need to manually run:\nsudo systemctl disable ${name}\nsudo systemctl stop ${name}\nsudo rm /etc/systemd/system/${name}.service`)) {
    return;
  }

  try {
    const updatedTasks = [...allStartupTasks];
    updatedTasks.splice(index, 1);

    const response = await fetch('/api/admin/startup-tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTasks)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Startup task deleted from configuration.\n\nRemember to manually remove the systemd service if needed.');
      loadStartupTasks();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Delete startup task error:', error);
    alert('Failed to delete startup task');
  }
}

function closeStartupTaskModal() {
  document.getElementById('startupTaskModal').classList.remove('active');
  document.getElementById('startupTaskForm').reset();
  editingStartupTaskId = null;
}

async function controlService(serviceName, action) {
  try {
    const response = await fetch(`/api/admin/startup-tasks/${serviceName}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message || `Service ${action} successful`);
      loadStartupTasks();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Service control error:', error);
    alert('Failed to control service. Make sure the app has sudo permissions.');
  }
}

async function viewServiceFile(serviceName, index) {
  const task = allStartupTasks[index];
  if (!task) return;

  try {
    const response = await fetch('/api/admin/startup-tasks/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(task)
    });

    const data = await response.json();

    if (response.ok) {
      const message = `Systemd Service File for: ${serviceName}\n` +
                     `Service Path: ${data.servicePath}\n\n` +
                     `To install manually:\n` +
                     `1. sudo nano ${data.servicePath}\n` +
                     `2. Paste the content below\n` +
                     `3. sudo systemctl daemon-reload\n` +
                     `4. sudo systemctl enable ${serviceName}\n` +
                     `5. sudo systemctl start ${serviceName}\n\n` +
                     `--- Service File Content ---\n\n${data.content}`;
      
      // Create a modal or alert with the content
      alert(message);
      
      // Copy to clipboard
      navigator.clipboard.writeText(data.content).then(() => {
        console.log('Service file copied to clipboard');
      });
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('View service file error:', error);
    alert('Failed to generate service file');
  }
}

document.getElementById('startupTaskForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const taskData = {
    name: document.getElementById('taskName').value.trim(),
    description: document.getElementById('taskDescription').value.trim(),
    command: document.getElementById('taskCommand').value.trim(),
    workingDirectory: document.getElementById('taskWorkDir').value.trim(),
    user: document.getElementById('taskUser').value.trim(),
    restartPolicy: document.getElementById('taskRestartPolicy').value,
    enabled: document.getElementById('taskEnabled').checked
  };

  if (!/^[a-z0-9-]+$/.test(taskData.name)) {
    alert('Task name must contain only lowercase letters, numbers, and hyphens');
    return;
  }

  try {
    let updatedTasks = [...allStartupTasks];

    if (editingStartupTaskId !== null) {
      updatedTasks[editingStartupTaskId] = taskData;
    } else {
      if (updatedTasks.find(t => t.name === taskData.name)) {
        alert('A task with this name already exists');
        return;
      }
      updatedTasks.push(taskData);
    }

    const response = await fetch('/api/admin/startup-tasks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTasks)
    });

    const data = await response.json();

    if (response.ok) {
      // Generate the service file
      await viewServiceFile(taskData.name, editingStartupTaskId !== null ? editingStartupTaskId : updatedTasks.length - 1);
      
      alert(editingStartupTaskId !== null ? 'Startup task updated!' : 'Startup task created!\n\nThe systemd service file has been copied to your clipboard.\nFollow the instructions to install it manually.');
      closeStartupTaskModal();
      loadStartupTasks();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Save startup task error:', error);
    alert('Failed to save startup task');
  }
});

document.getElementById('createStartupTaskBtn').addEventListener('click', showCreateStartupTaskModal);
document.getElementById('closeStartupTaskModal').addEventListener('click', closeStartupTaskModal);
document.getElementById('cancelStartupTaskBtn').addEventListener('click', closeStartupTaskModal);
document.getElementById('reloadStartupTasksBtn').addEventListener('click', loadStartupTasks);

// Make functions global for inline onclick handlers
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editTerminal = editTerminal;
window.deleteTerminal = deleteTerminal;
window.editStartupTask = editStartupTask;
window.deleteStartupTask = deleteStartupTask;
window.controlService = controlService;
window.viewServiceFile = viewServiceFile;

// Initialize
loadUsers();
loadTerminalsConfig();
loadStartupTasks();
