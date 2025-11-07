# 📦 RÉSUMÉ - Déploiement sur Serveur Personnel

## 🎯 Ce qui a été créé

Vous avez maintenant une **application web complète et sécurisée** pour gérer vos terminaux via tmux.

## 📂 Fichiers importants

### Configuration
- `.env` - Variables d'environnement (⚠️ À PERSONNALISER !)
- `config/terminals.json` - Configuration de vos terminaux
- `config/users.json` - Base de données des utilisateurs (généré automatiquement)

### Documentation
- `README.md` - Documentation complète
- `DEPLOYMENT.md` - Guide de déploiement en production
- `SECURITY.md` - Recommandations de sécurité
- `QUICKSTART.md` - Démarrage rapide

### Scripts
- `install.sh` - Script d'installation automatique (Linux)

## 🚀 Déploiement sur votre serveur - ÉTAPES

### 1. Transférer les fichiers

```bash
# Sur votre machine locale (depuis le dossier du projet)
scp -r . user@votre-serveur:/chemin/destination/mc-server-watcher

# Ou utilisez git (recommandé)
# Sur le serveur :
git clone https://github.com/CarrascoAlexis/mc-server-watcher.git
cd mc-server-watcher
```

### 2. Installer (Linux)

```bash
# Rendre le script exécutable
chmod +x install.sh

# Exécuter l'installation
./install.sh
```

Ou manuellement :

```bash
# Installer les dépendances
npm install --production

# Créer le fichier .env
cp .env.example .env

# IMPORTANT : Éditer .env avec vos paramètres
nano .env
```

### 3. Configurer vos terminaux

Éditez `config/terminals.json` :

```json
[
  {
    "id": "minecraft-server",
    "name": "Minecraft Server",
    "description": "Serveur Minecraft principal",
    "sessionName": "mc-server",
    "workingDirectory": "/home/user/minecraft-server",
    "initialCommand": "",
    "icon": "🎮"
  }
]
```

### 4. Créer l'utilisateur admin

```bash
npm run init
```

Suivez les instructions et notez bien vos identifiants !

### 5. Démarrer l'application

**Option A : Mode simple (test)**
```bash
npm start
```

**Option B : Avec systemd (production recommandée)**

Voir le fichier `DEPLOYMENT.md` section "Déploiement avec systemd"

### 6. Accéder à l'application

Ouvrez votre navigateur :
- **Local** : http://localhost:3000
- **Serveur distant** : http://IP-de-votre-serveur:3000

## ⚠️ IMPORTANT - Sécurité

### AVANT de déployer en production :

1. **Changez le JWT_SECRET** dans `.env` :
   ```bash
   openssl rand -base64 48
   ```
   Copiez le résultat dans `.env`

2. **Utilisez un mot de passe admin fort**

3. **Configurez HTTPS** avec Let's Encrypt (voir DEPLOYMENT.md)

4. **Configurez un pare-feu** :
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 3000/tcp  # Application (si pas de reverse proxy)
   sudo ufw enable
   ```

5. **Utilisez NGINX** comme reverse proxy (voir DEPLOYMENT.md)

## 🔧 Configuration recommandée pour production

```
Internet
   ↓
NGINX (port 80/443) avec HTTPS
   ↓
Application Node.js (port 3000)
   ↓
Sessions tmux
```

## 📋 Checklist de déploiement

- [ ] Fichiers transférés sur le serveur
- [ ] Dépendances npm installées
- [ ] .env configuré avec JWT_SECRET sécurisé
- [ ] config/terminals.json configuré avec vos serveurs
- [ ] Utilisateur admin créé (npm run init)
- [ ] Application testée en local
- [ ] Service systemd configuré (optionnel mais recommandé)
- [ ] NGINX configuré (optionnel mais recommandé)
- [ ] HTTPS configuré avec Let's Encrypt (production)
- [ ] Pare-feu configuré
- [ ] Backup automatique configuré

## 🎮 Utilisation

### En tant qu'admin

1. Connectez-vous avec vos identifiants admin
2. Accédez au "Admin Panel"
3. Créez des utilisateurs
4. Assignez les terminaux autorisés à chaque utilisateur

### En tant qu'utilisateur

1. Connectez-vous avec vos identifiants
2. Sélectionnez un terminal dans la barre latérale
3. Interagissez avec le terminal en temps réel
4. Tapez vos commandes et envoyez-les

## 🆘 Aide rapide

### Le serveur ne démarre pas
```bash
# Vérifier les logs
npm start

# Vérifier si le port est libre
netstat -tulpn | grep 3000
```

### Impossible de se connecter
- Vérifiez que le serveur est démarré
- Vérifiez votre pare-feu
- Vérifiez l'adresse IP/port

### Erreur tmux
- Vérifiez que tmux est installé : `tmux -V`
- Vérifiez les permissions sur les répertoires configurés

## 📞 Support

Consultez les fichiers de documentation :
- **README.md** - Documentation complète
- **DEPLOYMENT.md** - Déploiement détaillé
- **SECURITY.md** - Sécurité
- **QUICKSTART.md** - Démarrage rapide

## 🎉 Bon déploiement !

Votre application est prête à être déployée. N'oubliez pas de :
- ✅ Sécuriser vos mots de passe
- ✅ Configurer HTTPS
- ✅ Faire des backups réguliers
- ✅ Surveiller les logs

Bonne chance ! 🚀
