const { v4: uuidv4 } = require('uuid');
const authManager = require('./auth');

class UserManager {
  /**
   * Get all users (without passwords)
   */
  async getAllUsers() {
    const users = await authManager.loadUsers();
    return users.map(({ password, ...user }) => user);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const users = await authManager.loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const users = await authManager.loadUsers();

    // Check if username already exists
    if (users.find(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }

    // Validate required fields
    if (!userData.username || !userData.password) {
      throw new Error('Username and password are required');
    }

    // Hash password
    const hashedPassword = await authManager.hashPassword(userData.password);

    const newUser = {
      id: uuidv4(),
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'user',
      terminals: userData.terminals || [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await authManager.saveUsers(users);

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async updateUser(userId, updates) {
    const users = await authManager.loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Prevent updating to existing username
    if (updates.username && updates.username !== users[userIndex].username) {
      if (users.find(u => u.username === updates.username)) {
        throw new Error('Username already exists');
      }
    }

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await authManager.hashPassword(updates.password);
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await authManager.saveUsers(users);

    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    const users = await authManager.loadUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Prevent deleting the last admin
    const user = users[userIndex];
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    users.splice(userIndex, 1);
    await authManager.saveUsers(users);

    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Update user terminals access
   */
  async updateUserTerminals(userId, terminals) {
    return await this.updateUser(userId, { terminals });
  }
}

module.exports = new UserManager();
