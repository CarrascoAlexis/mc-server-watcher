# Recreate Tmux Sessions Script (PowerShell for WSL)
# This script kills existing tmux sessions and recreates them with correct working directories

Write-Host "🔄 Recreating tmux sessions with correct working directories..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Killing existing sessions..." -ForegroundColor Yellow

wsl bash -c "tmux kill-session -t mc-server 2>/dev/null" 
if ($LASTEXITCODE -eq 0) { 
    Write-Host "  ✅ Killed mc-server" -ForegroundColor Green 
} else { 
    Write-Host "  ℹ️  mc-server not running" -ForegroundColor Gray 
}

wsl bash -c "tmux kill-session -t web-app 2>/dev/null"
if ($LASTEXITCODE -eq 0) { 
    Write-Host "  ✅ Killed web-app" -ForegroundColor Green 
} else { 
    Write-Host "  ℹ️  web-app not running" -ForegroundColor Gray 
}

wsl bash -c "tmux kill-session -t backup-mgmt 2>/dev/null"
if ($LASTEXITCODE -eq 0) { 
    Write-Host "  ✅ Killed backup-mgmt" -ForegroundColor Green 
} else { 
    Write-Host "  ℹ️  backup-mgmt not running" -ForegroundColor Gray 
}

Write-Host ""
Write-Host "🆕 Creating new sessions with correct directories..." -ForegroundColor Yellow

# Create minecraft-server session
wsl bash -c "mkdir -p ~/MCServer && tmux new-session -d -s mc-server -c ~/MCServer"
Write-Host "  ✅ Created mc-server in ~/MCServer" -ForegroundColor Green

# Create web-app session
wsl bash -c "mkdir -p ~/Documents/mc-server-watcher && tmux new-session -d -s web-app -c ~/Documents/mc-server-watcher"
Write-Host "  ✅ Created web-app in ~/Documents/mc-server-watcher" -ForegroundColor Green

# Create backup-mgmt session
wsl bash -c "tmux new-session -d -s backup-mgmt -c ~"
Write-Host "  ✅ Created backup-mgmt in ~" -ForegroundColor Green

Write-Host ""
Write-Host "📊 Current tmux sessions:" -ForegroundColor Cyan
wsl bash -c "tmux list-sessions"

Write-Host ""
Write-Host "🔍 Verifying working directories:" -ForegroundColor Cyan

Write-Host "  mc-server:" -ForegroundColor White
wsl bash -c "tmux send-keys -t mc-server 'pwd' C-m; sleep 0.3; tmux capture-pane -t mc-server -p | tail -2"

Write-Host "  web-app:" -ForegroundColor White
wsl bash -c "tmux send-keys -t web-app 'pwd' C-m; sleep 0.3; tmux capture-pane -t web-app -p | tail -2"

Write-Host "  backup-mgmt:" -ForegroundColor White
wsl bash -c "tmux send-keys -t backup-mgmt 'pwd' C-m; sleep 0.3; tmux capture-pane -t backup-mgmt -p | tail -2"

Write-Host ""
Write-Host "✅ Done! All sessions recreated with correct working directories." -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Sessions will be automatically created with correct directories" -ForegroundColor Cyan
Write-Host "   when you access them through the web interface from now on." -ForegroundColor Cyan
