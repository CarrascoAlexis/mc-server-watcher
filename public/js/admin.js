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
      container.innerHTML = '<p>No terminals configured yet.</p>';
      return;
    }

    allTerminals.forEach(terminal => {
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

// Make functions global for inline onclick handlers
window.editUser = editUser;
window.deleteUser = deleteUser;

// Initialize
loadUsers();
loadTerminalsConfig();
