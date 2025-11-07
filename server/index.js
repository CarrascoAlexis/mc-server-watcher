require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authManager = require('./auth');
const userManager = require('./user-manager');
const tmuxManager = require('./tmux-manager');
const startupManager = require('./startup-manager');
const securityManager = require('./security-manager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Configure this properly in production
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for WebSocket support
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize security manager
securityManager.loadConfig().catch(console.error);

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1';
}

// ==================== API ROUTES ====================

/**
 * Login endpoint
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await authManager.authenticate(username, password);

    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify token endpoint
 */
app.get('/api/verify', authManager.verifyTokenMiddleware(), (req, res) => {
  res.json({ valid: true, user: req.user });
});

/**
 * Get user's accessible terminals
 */
app.get('/api/terminals', authManager.verifyTokenMiddleware(), async (req, res) => {
  try {
    const terminals = await tmuxManager.getUserTerminals(req.user.terminals);
    res.json(terminals);
  } catch (error) {
    console.error('Get terminals error:', error);
    res.status(500).json({ error: 'Failed to load terminals' });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * Get all users (admin only)
 */
app.get('/api/admin/users', 
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const users = await userManager.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to load users' });
    }
  }
);

/**
 * Create user (admin only)
 */
app.post('/api/admin/users',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const user = await userManager.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Update user (admin only)
 */
app.put('/api/admin/users/:userId',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const user = await userManager.updateUser(req.params.userId, req.body);
      res.json(user);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Delete user (admin only)
 */
app.delete('/api/admin/users/:userId',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const result = await userManager.deleteUser(req.params.userId);
      res.json(result);
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Get all terminals config (admin only)
 */
app.get('/api/admin/terminals',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const terminals = await tmuxManager.getAllTerminals();
      res.json(terminals);
    } catch (error) {
      console.error('Get all terminals error:', error);
      res.status(500).json({ error: 'Failed to load terminals' });
    }
  }
);

/**
 * Update terminals config (admin only)
 */
app.put('/api/admin/terminals',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const terminals = req.body;
      
      // Validate terminals array
      if (!Array.isArray(terminals)) {
        return res.status(400).json({ error: 'Invalid terminals data' });
      }

      // Save to file
      await tmuxManager.saveTerminals(terminals);
      res.json({ success: true, message: 'Terminals updated successfully' });
    } catch (error) {
      console.error('Update terminals error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Execute command on specific tmux channel
 * Body: { terminalId, command, configPath? }
 */
app.post('/api/execute-channel',
  authManager.verifyTokenMiddleware(),
  async (req, res) => {
    try {
      const { terminalId, command, configPath } = req.body;

      if (!terminalId || !command) {
        return res.status(400).json({ error: 'terminalId and command are required' });
      }

      // Security validation
      const clientIP = getClientIP(req);
      const username = req.user.username;
      
      const securityCheck = await securityManager.validateAccess(
        terminalId,
        username,
        clientIP,
        command
      );

      if (!securityCheck.allowed) {
        return res.status(403).json({ 
          error: 'Access denied',
          reasons: securityCheck.reasons,
          requiresApproval: securityCheck.requiresApproval,
          retryAfter: securityCheck.retryAfter
        });
      }

      const result = await tmuxManager.executeOnChannel(terminalId, command, configPath);
      res.json(result);
    } catch (error) {
      console.error('Execute on channel error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Execute command on multiple tmux channels
 * Body: { terminalIds: [], command, configPath? }
 */
app.post('/api/execute-multiple-channels',
  authManager.verifyTokenMiddleware(),
  async (req, res) => {
    try {
      const { terminalIds, command, configPath } = req.body;

      if (!terminalIds || !Array.isArray(terminalIds) || !command) {
        return res.status(400).json({ error: 'terminalIds (array) and command are required' });
      }

      const clientIP = getClientIP(req);
      const username = req.user.username;
      const results = [];

      // Validate security for each terminal
      for (const terminalId of terminalIds) {
        const securityCheck = await securityManager.validateAccess(
          terminalId,
          username,
          clientIP,
          command
        );

        if (!securityCheck.allowed) {
          results.push({
            terminalId,
            success: false,
            error: 'Access denied',
            reasons: securityCheck.reasons
          });
          continue;
        }

        try {
          const result = await tmuxManager.executeOnChannel(terminalId, command, configPath);
          results.push({ terminalId, ...result });
        } catch (error) {
          results.push({
            terminalId,
            success: false,
            error: error.message
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Execute on multiple channels error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Execute command on all tmux channels from config
 * Body: { command, configPath? }
 */
app.post('/api/execute-all-channels',
  authManager.verifyTokenMiddleware(),
  async (req, res) => {
    try {
      const { command, configPath } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'command is required' });
      }

      const clientIP = getClientIP(req);
      const username = req.user.username;
      
      // Get all terminals
      const terminals = await tmuxManager.loadTerminalsConfig(configPath);
      const results = [];

      // Validate and execute on each terminal
      for (const terminal of terminals) {
        const securityCheck = await securityManager.validateAccess(
          terminal.id,
          username,
          clientIP,
          command
        );

        if (!securityCheck.allowed) {
          results.push({
            terminalId: terminal.id,
            success: false,
            error: 'Access denied',
            reasons: securityCheck.reasons
          });
          continue;
        }

        try {
          const result = await tmuxManager.executeOnChannel(terminal.id, command, configPath);
          results.push({ terminalId: terminal.id, ...result });
        } catch (error) {
          results.push({
            terminalId: terminal.id,
            success: false,
            error: error.message
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error('Execute on all channels error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ==================== STARTUP TASKS ROUTES ====================

/**
 * Get all startup tasks (admin only)
 */
app.get('/api/admin/startup-tasks',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const tasks = await startupManager.getAllServicesStatus();
      res.json(tasks);
    } catch (error) {
      console.error('Get startup tasks error:', error);
      res.status(500).json({ error: 'Failed to load startup tasks' });
    }
  }
);

/**
 * Create or update startup tasks (admin only)
 */
app.put('/api/admin/startup-tasks',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const tasks = req.body;
      
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Invalid tasks data' });
      }

      await startupManager.saveStartupTasks(tasks);
      res.json({ success: true, message: 'Startup tasks updated successfully' });
    } catch (error) {
      console.error('Update startup tasks error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Generate systemd service file (admin only)
 */
app.post('/api/admin/startup-tasks/generate',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const task = req.body;
      const result = await startupManager.createService(task);
      res.json(result);
    } catch (error) {
      console.error('Generate service error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Get security configuration (admin only)
 */
app.get('/api/admin/security',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const config = await securityManager.loadConfig();
      res.json(config);
    } catch (error) {
      console.error('Get security config error:', error);
      res.status(500).json({ error: 'Failed to load security configuration' });
    }
  }
);

/**
 * Update security configuration (admin only)
 */
app.put('/api/admin/security',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      await securityManager.saveConfig(req.body);
      securityManager.config = req.body; // Update in memory
      res.json({ success: true, message: 'Security configuration updated' });
    } catch (error) {
      console.error('Update security config error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * Get security logs (admin only)
 */
app.get('/api/admin/security/logs',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const filters = {
        terminalId: req.query.terminalId,
        username: req.query.username,
        eventType: req.query.eventType,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      
      const logs = await securityManager.getSecurityLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Get security logs error:', error);
      res.status(500).json({ error: 'Failed to load security logs' });
    }
  }
);

/**
 * Control service (start/stop/restart) (admin only)
 */
app.post('/api/admin/startup-tasks/:serviceName/:action',
  authManager.verifyTokenMiddleware(),
  authManager.verifyAdminMiddleware(),
  async (req, res) => {
    try {
      const { serviceName, action } = req.params;
      let result;

      switch (action) {
        case 'start':
          result = await startupManager.startService(serviceName);
          break;
        case 'stop':
          result = await startupManager.stopService(serviceName);
          break;
        case 'restart':
          result = await startupManager.restartService(serviceName);
          break;
        case 'enable':
          result = await startupManager.enableService(serviceName);
          break;
        case 'disable':
          result = await startupManager.disableService(serviceName);
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      res.json(result);
    } catch (error) {
      console.error('Service control error:', error);
      res.status(400).json({ error: error.message });
    }
  }
);

// ==================== WEBSOCKET HANDLING ====================

const activeStreams = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  const user = authManager.verifyToken(token);
  
  if (!user) {
    return next(new Error('Authentication error'));
  }

  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  /**
   * Attach to terminal
   */
  socket.on('attach-terminal', async (data) => {
    try {
      const { terminalId } = data;

      // Check if user has access to this terminal
      if (!socket.user.terminals.includes(terminalId)) {
        socket.emit('error', { message: 'Access denied to this terminal' });
        return;
      }

      // Create or attach to session
      const { sessionName, terminal } = await tmuxManager.createOrAttachSession(terminalId);

      // Get initial output
      const output = await tmuxManager.captureOutput(sessionName);
      socket.emit('terminal-output', { terminalId, output });

      // Start streaming output
      const streamKey = `${socket.id}-${terminalId}`;
      const stopStream = tmuxManager.streamOutput(sessionName, (output) => {
        socket.emit('terminal-output', { terminalId, output });
      });

      activeStreams.set(streamKey, stopStream);

      socket.emit('terminal-attached', { terminalId, sessionName, terminal });
    } catch (error) {
      console.error('Attach terminal error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Send command to terminal
   */
  socket.on('send-command', async (data) => {
    try {
      const { terminalId, command } = data;

      // Check if user has access
      if (!socket.user.terminals.includes(terminalId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Security validation
      const clientIP = socket.handshake.address;
      const username = socket.user.username;
      
      const securityCheck = await securityManager.validateAccess(
        terminalId,
        username,
        clientIP,
        command
      );

      if (!securityCheck.allowed) {
        socket.emit('error', { 
          message: 'Command denied',
          reasons: securityCheck.reasons,
          requiresApproval: securityCheck.requiresApproval
        });
        return;
      }

      const terminal = await tmuxManager.getTerminalInfo(terminalId);
      const sessionName = terminal.sessionName || terminal.id;

      await tmuxManager.sendCommand(sessionName, command);
      socket.emit('command-sent', { terminalId, command });
    } catch (error) {
      console.error('Send command error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Detach from terminal
   */
  socket.on('detach-terminal', (data) => {
    const { terminalId } = data;
    const streamKey = `${socket.id}-${terminalId}`;
    
    const stopStream = activeStreams.get(streamKey);
    if (stopStream) {
      stopStream();
      activeStreams.delete(streamKey);
    }

    socket.emit('terminal-detached', { terminalId });
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);

    // Stop all streams for this socket
    for (const [key, stopStream] of activeStreams.entries()) {
      if (key.startsWith(socket.id)) {
        stopStream();
        activeStreams.delete(key);
      }
    }
  });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   MC Server Watcher - Terminal Management System  ║
╠═══════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
