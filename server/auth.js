const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, '../config/users.json');

class AuthManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me';
    this.sessionDuration = process.env.SESSION_DURATION || '24h';
  }

  /**
   * Load users from JSON file
   */
  async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return empty array
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save users to JSON file
   */
  async saveUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      terminals: user.terminals
    };
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.sessionDuration });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Authenticate user
   */
  async authenticate(username, password) {
    const users = await this.loadUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isValid = await this.verifyPassword(password, user.password);
    
    if (!isValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    const token = this.generateToken(user);
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        terminals: user.terminals
      }
    };
  }

  /**
   * Middleware to verify JWT token
   */
  verifyTokenMiddleware() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = this.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = decoded;
      next();
    };
  }

  /**
   * Middleware to verify admin role
   */
  verifyAdminMiddleware() {
    return (req, res, next) => {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    };
  }
}

module.exports = new AuthManager();
