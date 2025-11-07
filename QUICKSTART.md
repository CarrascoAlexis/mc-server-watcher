# 🚀 Guide de Démarrage Rapide

## Installation en 5 minutes

### 1. Installer les dépendances
```powershell
npm install
```

### 2. Configurer le terminal Minecraft

Éditez `config/terminals.json` et modifiez le chemin du serveur Minecraft :

```json
[
  {
    "id": "minecraft-server",
    "name": "Minecraft Server",
    "description": "Main Minecraft server console",
    "sessionName": "mc-server",
    "workingDirectory": "C:\\chemin\\vers\\votre\\serveur\\minecraft",
    "initialCommand": "",
    "icon": "🎮"
  }
]
```

**Important pour Windows :**
- Utilisez des doubles backslash `\\` dans les chemins
- Ou utilisez des slashes `/` : `C:/chemin/vers/serveur`

### 3. Créer l'utilisateur admin

```powershell
npm run init
```

Entrez votre nom d'utilisateur et mot de passe admin.

### 4. Démarrer le serveur

```powershell
npm start
```

### 5. Se connecter

Ouvrez votre navigateur à l'adresse : **http://localhost:3000**

Connectez-vous avec les identifiants admin créés à l'étape 3.

## Ajouter des utilisateurs

1. Cliquez sur **"Admin Panel"**
2. Cliquez sur **"+ Create User"**
3. Remplissez le formulaire
4. Cochez les terminaux auxquels l'utilisateur aura accès
5. Cliquez sur **"Save"**

## Ajouter des terminaux

Éditez le fichier `config/terminals.json` et ajoutez de nouveaux objets :

```json
[
  {
    "id": "minecraft-server",
    "name": "Minecraft Server",
    "description": "Serveur principal",
    "sessionName": "mc-server",
    "workingDirectory": "C:/servers/minecraft",
    "initialCommand": "",
    "icon": "🎮"
  },
  {
    "id": "backup-server",
    "name": "Backup Server",
    "description": "Serveur de backup",
    "sessionName": "backup",
    "workingDirectory": "C:/servers/backup",
    "initialCommand": "",
    "icon": "💾"
  }
]
```

Rechargez la configuration dans le panel admin.

## Note importante pour Windows

Ce système utilise **tmux** qui n'est pas disponible nativement sur Windows. Vous avez plusieurs options :

### Option 1 : WSL (Recommandé)
Utilisez Windows Subsystem for Linux :

```powershell
# Installer WSL
wsl --install

# Dans WSL, installer tmux
sudo apt update
sudo apt install tmux

# Lancer le serveur dans WSL
cd /mnt/c/Users/Alexis/Documents/mc-server-watcher
npm start
```

### Option 2 : Adapter pour PowerShell
Vous pourriez modifier `server/tmux-manager.js` pour utiliser PowerShell au lieu de tmux, mais cela nécessiterait des modifications importantes.

## Problèmes courants

### "tmux: command not found"
- Sur Windows : Installez WSL ou utilisez Git Bash avec tmux
- Sur Linux : `sudo apt install tmux` ou `sudo yum install tmux`

### Le port 3000 est déjà utilisé
Modifiez le port dans `.env` :
```env
PORT=3001
```

### Impossible de se connecter
- Vérifiez que le serveur est démarré
- Vérifiez votre pare-feu
- Essayez `http://127.0.0.1:3000` au lieu de localhost

## Support

Pour plus d'informations, consultez le **README.md** complet.
