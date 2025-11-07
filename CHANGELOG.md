# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Tmux Channel Execution API**: Execute commands on tmux channels via REST API
  - Single channel execution endpoint (`/api/execute-channel`)
  - Multiple channels execution endpoint (`/api/execute-multiple-channels`)
  - All channels execution endpoint (`/api/execute-all-channels`)
  - Support for custom configuration file paths
  - Automatic tmux session creation if doesn't exist
- **CLI Tool for Command Execution** (`scripts/tmux-exec.js`)
  - Execute commands on single, multiple, or all channels
  - Token management (save/load from .env)
  - Custom config file support
- **Bash Script Examples** (`scripts/tmux-commands.sh`)
  - Interactive menu for common operations
  - Minecraft server management examples
  - System maintenance examples
  - Batch operations support
- **Startup Tasks Management** (Admin Panel)
  - Create and manage systemd services
  - Start/Stop/Restart services from web interface
  - Enable/Disable services at boot
  - View and generate systemd service files
  - Service status monitoring
- **Terminal Configuration Management** (Admin Panel)
  - Create new terminal configurations from UI
  - Edit existing terminal configurations
  - Delete terminal configurations
  - Real-time configuration updates
- **Documentation**
  - Complete tmux execution guide (`docs/TMUX-EXECUTION.md`)
  - Example configuration files
  - Usage examples for API, CLI, and scripts

### Changed
- Enhanced `tmux-manager.js` with new methods:
  - `executeOnChannel()`: Execute command on specific channel
  - `executeOnMultipleChannels()`: Execute on multiple channels
  - `executeOnAllChannels()`: Execute on all configured channels
  - `loadTerminalsConfig()`: Now supports custom config file path
  - `createOrAttachSession()`: Now supports custom config file path
- Updated README.md with new features documentation
- Improved error handling for tmux operations

### Fixed
- Terminal input alignment (fixed at bottom)
- Send button sizing issues
- TAB key support in terminal input

## [1.0.0] - 2025-11-07

### Added
- Initial release
- JWT-based authentication system
- User management (CRUD operations)
- Terminal access control
- Real-time terminal interaction via WebSocket
- Admin panel for user and terminal management
- Tmux session management
- Multi-user support with role-based access
- Responsive web interface
- Security features:
  - Helmet.js for HTTP headers
  - Rate limiting
  - CORS protection
  - Password hashing with bcrypt
- Documentation:
  - README.md
  - DEPLOYMENT.md
  - SECURITY.md
  - QUICKSTART.md
  - DEVELOPMENT.md
  - API.md
  - CONTRIBUTING.md

### Features
- **Authentication & Authorization**
  - JWT token-based authentication
  - Admin and user roles
  - 24-hour session duration
  - Secure password hashing

- **User Management**
  - Create, read, update, delete users
  - Assign terminals to users
  - Role management (admin/user)

- **Terminal Management**
  - Configure multiple tmux sessions
  - Custom working directories
  - Initial commands support
  - Session persistence
  - Real-time output streaming

- **Web Interface**
  - Login page
  - User dashboard with terminal access
  - Admin panel for management
  - Real-time terminal emulator (xterm.js)
  - Responsive design

- **Deployment**
  - Systemd service support
  - NGINX reverse proxy configuration
  - Let's Encrypt SSL support
  - Installation scripts
  - Health check scripts

### Security
- Rate limiting (100 requests per 15 minutes)
- HTTP security headers via Helmet.js
- CORS protection
- JWT token validation
- Password hashing with bcrypt (10 rounds)
- Environment variable configuration
- Input validation

### Documentation
- Complete installation guide
- Deployment instructions
- Security best practices
- API documentation
- Development guide
- Quick start guide
- Contributing guidelines

---

## Version History

### [Unreleased] - Current Development
- Tmux channel execution API
- Startup tasks management
- Enhanced terminal configuration UI
- CLI tools and scripts

### [1.0.0] - 2025-11-07
- Initial stable release
- Core features: auth, users, terminals, admin panel
- Complete documentation
- Deployment support
