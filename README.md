"# 🎮 MC Server Watcher - Terminal Management System

Application web sécurisée pour gérer des sessions tmux et interagir avec des terminaux à distance. Conçue initialement pour la gestion de serveurs Minecraft, elle peut être adaptée pour n'importe quel type de serveur ou terminal.

## 📋 Fonctionnalités

### Pour les utilisateurs
- 🔐 **Authentification sécurisée** avec JWT
- 🖥️ **Accès aux terminaux autorisés** uniquement
- 💬 **Interface terminal interactive** avec xterm.js
- 🔄 **Mise à jour en temps réel** via WebSocket
- 📱 **Interface responsive** adaptée mobile
- 🎯 **Exécution de commandes sur canaux tmux** via API ou CLI

### Pour les administrateurs
- 👥 **Gestion complète des utilisateurs** (CRUD)
- ⚙️ **Configuration des accès** par terminal
- 🔒 **Rôles et permissions** (admin/user)
- 📊 **Panel d'administration** intuitif
- 🚀 **Gestion des tâches au démarrage** via systemd
- 🔌 **API d'exécution de commandes** sur un ou plusieurs canaux tmux
- 🛡️ **Sécurité avancée** :
  - Restrictions par IP/réseau (CIDR)
  - Filtrage de commandes (whitelist/blacklist)
  - Limitations par utilisateur et terminal
  - Rate limiting anti-spam
  - Audit logging complet

## 🚀 Installation

### Prérequis

- **Node.js** v16 ou supérieur
- **tmux** installé sur le système
- **Git** (optionnel)

### Étapes d'installation

1. **Cloner le dépôt** (ou télécharger les fichiers)
```bash
git clone https://github.com/CarrascoAlexis/mc-server-watcher.git
cd mc-server-watcher
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration**

Créer un fichier `.env` à partir du template :
```bash
cp .env.example .env
```

Éditer le fichier `.env` :
```env
PORT=3000
NODE_ENV=production

# IMPORTANT: Changer cette clé secrète!
JWT_SECRET=votre-cle-secrete-super-securisee-ici

SESSION_DURATION=24h

ADMIN_USERNAME=admin
ADMIN_PASSWORD=VotreMotDePasseSecurise123!

TMUX_SOCKET_PATH=/tmp/tmux-server-watcher
```

4. **Configurer vos terminaux**

Éditer `config/terminals.json` :
```json
[
  {
    "id": "minecraft-server",
    "name": "Minecraft Server",
    "description": "Serveur Minecraft principal",
    "sessionName": "mc-server",
    "workingDirectory": "/home/user/minecraft",
    "initialCommand": "",
    "icon": "🎮"
  },
  {
    "id": "backup-server",
    "name": "Backup Server",
    "description": "Serveur de backup",
    "sessionName": "backup",
    "workingDirectory": "/home/user/backups",
    "initialCommand": "",
    "icon": "💾"
  }
]
```

**Paramètres disponibles :**
- `id` : Identifiant unique du terminal (requis)
- `name` : Nom affiché (requis)
- `description` : Description courte
- `sessionName` : Nom de la session tmux (défaut: id)
- `workingDirectory` : Répertoire de travail pour la session tmux
- `initialCommand` : Commande à exécuter au démarrage de la session
- `icon` : Emoji ou icône à afficher

5. **Initialiser l'utilisateur admin**
```bash
npm run init
```

Suivez les instructions pour créer votre premier compte administrateur.

## 🎯 Utilisation

### Démarrer le serveur

**Mode production :**
```bash
npm start
```

**Mode développement** (avec rechargement automatique) :
```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Première connexion

1. Accédez à `http://localhost:3000/login.html`
2. Connectez-vous avec le compte admin créé précédemment
3. Vous serez redirigé vers le dashboard

### Créer des utilisateurs

1. Connectez-vous en tant qu'admin
2. Cliquez sur "Admin Panel"
3. Cliquez sur "+ Create User"
4. Remplissez le formulaire :
   - **Username** : nom d'utilisateur unique
   - **Password** : mot de passe (8 caractères minimum recommandé)
   - **Role** : user ou admin
   - **Terminals Access** : cochez les terminaux autorisés
5. Cliquez sur "Save"

### Utiliser les terminaux

1. Connectez-vous avec votre compte
2. Dans le sidebar, cliquez sur un terminal autorisé
3. Le terminal s'affiche et se connecte automatiquement à la session tmux
4. Tapez vos commandes dans le champ en bas et appuyez sur "Send" ou Entrée

### Commandes utiles

- **Clear** : Efface l'affichage du terminal (côté client uniquement)
- **Reconnect** : Se reconnecte à la session tmux
- **Détacher** : Cliquez sur un autre terminal ou déconnectez-vous

## ⚡ Exécution de commandes sur canaux tmux

Cette fonctionnalité permet d'exécuter des commandes sur des canaux tmux configurés, que ce soit via l'API ou en ligne de commande.

### Via l'API REST

#### Exécuter sur un seul canal
```bash
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalId": "minecraft-server",
    "command": "say Hello from API!"
  }'
```

#### Exécuter sur plusieurs canaux
```bash
curl -X POST http://localhost:3000/api/execute-multiple-channels \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalIds": ["minecraft-server", "backup-server"],
    "command": "uptime"
  }'
```

#### Exécuter sur tous les canaux
```bash
curl -X POST http://localhost:3000/api/execute-all-channels \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "date"
  }'
```

### Via CLI (scripts/tmux-exec.js)

Un outil en ligne de commande est fourni pour faciliter l'exécution :

#### Configuration initiale
```bash
# Définir le token d'authentification
node scripts/tmux-exec.js --token VOTRE_JWT_TOKEN
```

#### Utilisation
```bash
# Exécuter sur un canal spécifique
node scripts/tmux-exec.js minecraft-server "say Server maintenance"

# Exécuter sur plusieurs canaux
node scripts/tmux-exec.js --multiple mc-server,backup "uptime"

# Exécuter sur tous les canaux
node scripts/tmux-exec.js --all "date"

# Utiliser un fichier de config personnalisé
node scripts/tmux-exec.js --config /path/to/config.json minecraft-server "status"
```

### Fonctionnalités avancées

- ✅ **Création automatique de sessions** : Si la session tmux n'existe pas, elle est créée automatiquement
- ✅ **Support de fichiers de config multiples** : Utilisez `configPath` pour spécifier un fichier de configuration alternatif
- ✅ **Gestion d'erreurs robuste** : Retours détaillés pour chaque canal
- ✅ **Authentification JWT** : Toutes les opérations nécessitent une authentification

📖 **Documentation complète** : Voir [docs/TMUX-EXECUTION.md](docs/TMUX-EXECUTION.md)

## 🔧 Configuration avancée

### Utiliser avec systemd (Linux)

Créer le fichier `/etc/systemd/system/mc-watcher.service` :

```ini
[Unit]
Description=MC Server Watcher
After=network.target

[Service]
Type=simple
User=votre-utilisateur
WorkingDirectory=/chemin/vers/mc-server-watcher
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :
```bash
sudo systemctl enable mc-watcher
sudo systemctl start mc-watcher
sudo systemctl status mc-watcher
```

### Utiliser avec un reverse proxy (nginx)

Exemple de configuration nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Sécurité HTTPS avec Let's Encrypt

```bash
sudo certbot --nginx -d votre-domaine.com
```

## 🛡️ Sécurité

### Bonnes pratiques

1. **Changez le JWT_SECRET** dans `.env` avec une valeur aléatoire forte
2. **Utilisez HTTPS** en production
3. **Mots de passe forts** pour tous les comptes
4. **Limitez les accès** : donnez uniquement les terminaux nécessaires à chaque utilisateur
5. **Mises à jour régulières** : `npm update`
6. **Firewall** : limitez l'accès au port 3000 ou utilisez un reverse proxy
7. **Backups** : sauvegardez régulièrement `config/users.json` et `config/terminals.json`

### Protection rate limiting

Le serveur inclut une protection contre les attaques par force brute (100 requêtes par IP toutes les 15 minutes sur les routes API).

## 📁 Structure du projet

```
mc-server-watcher/
├── server/
│   ├── index.js           # Serveur principal Express + Socket.IO
│   ├── auth.js            # Gestion de l'authentification JWT
│   ├── user-manager.js    # CRUD utilisateurs
│   ├── tmux-manager.js    # Gestion des sessions tmux
│   └── init-admin.js      # Script d'initialisation admin
├── public/
│   ├── login.html         # Page de connexion
│   ├── dashboard.html     # Interface utilisateur
│   ├── admin.html         # Panel administrateur
│   ├── css/
│   │   └── style.css      # Styles de l'application
│   └── js/
│       ├── login.js       # Logique de connexion
│       ├── dashboard.js   # Logique dashboard
│       └── admin.js       # Logique admin
├── config/
│   ├── terminals.json     # Configuration des terminaux
│   └── users.json         # Base de données utilisateurs (généré)
├── .env                   # Variables d'environnement (à créer)
├── .env.example           # Template de configuration
├── package.json           # Dépendances Node.js
└── README.md             # Ce fichier
```

## 🔍 Dépannage

### Le serveur ne démarre pas

- Vérifiez que le port 3000 n'est pas déjà utilisé : `netstat -ano | findstr :3000`
- Vérifiez les logs d'erreur dans la console
- Assurez-vous que `.env` existe et contient les bonnes valeurs

### Impossible de se connecter au terminal

- Vérifiez que tmux est installé : `tmux -V`
- Vérifiez que l'utilisateur qui lance le serveur a les droits d'accès aux répertoires configurés
- Testez manuellement la création d'une session tmux : `tmux new -s test`

### Erreur d'authentification

- Vérifiez que le token JWT n'a pas expiré (24h par défaut)
- Effacez le localStorage du navigateur et reconnectez-vous
- Vérifiez le fichier `config/users.json`

### Les terminaux ne s'affichent pas

- Vérifiez `config/terminals.json`
- Vérifiez que l'utilisateur a bien les terminaux assignés (dans le panel admin)
- Rechargez la page

## 📝 API Routes

### Authentification
- `POST /api/login` - Connexion
- `GET /api/verify` - Vérifier le token

### Utilisateur
- `GET /api/terminals` - Liste des terminaux accessibles

### Admin (admin uniquement)
- `GET /api/admin/users` - Liste tous les utilisateurs
- `POST /api/admin/users` - Créer un utilisateur
- `PUT /api/admin/users/:userId` - Modifier un utilisateur
- `DELETE /api/admin/users/:userId` - Supprimer un utilisateur
- `GET /api/admin/terminals` - Liste tous les terminaux
- `PUT /api/admin/terminals` - Mettre à jour la configuration des terminaux
- `GET /api/admin/startup-tasks` - Liste toutes les tâches de démarrage
- `PUT /api/admin/startup-tasks` - Mettre à jour les tâches de démarrage
- `POST /api/admin/startup-tasks/generate` - Générer un fichier systemd
- `POST /api/admin/startup-tasks/:serviceName/:action` - Contrôler un service (start/stop/restart/enable/disable)

### Exécution de commandes sur canaux tmux
- `POST /api/execute-channel` - Exécuter une commande sur un canal spécifique
- `POST /api/execute-multiple-channels` - Exécuter une commande sur plusieurs canaux
- `POST /api/execute-all-channels` - Exécuter une commande sur tous les canaux

### WebSocket Events

**Client → Server :**
- `attach-terminal` - Se connecter à un terminal
- `send-command` - Envoyer une commande
- `detach-terminal` - Se déconnecter d'un terminal

**Server → Client :**
- `terminal-output` - Sortie du terminal
- `terminal-attached` - Confirmation de connexion
- `terminal-detached` - Confirmation de déconnexion
- `command-sent` - Confirmation d'envoi de commande
- `error` - Erreur

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 👨‍💻 Auteur

**Alexis Carrasco**

---

**Note** : Ce projet est conçu pour fonctionner sur des systèmes Linux/Unix avec tmux. Pour Windows, vous devrez adapter la partie tmux ou utiliser WSL (Windows Subsystem for Linux)." 
