# 🚀 Guide de Déploiement en Production

## ⚠️ Checklist de Sécurité AVANT le Déploiement

### 1. Configuration de l'environnement

Éditez votre fichier `.env` sur le serveur :

```env
# IMPORTANT : Utilisez des valeurs sécurisées !
PORT=3000
NODE_ENV=production

# Générez une clé secrète forte (minimum 32 caractères)
# Exemple : openssl rand -base64 32
JWT_SECRET=CHANGEZ_CETTE_CLE_AVEC_UNE_VALEUR_ALEATOIRE_TRES_LONGUE_ET_SECURISEE

# Durée de session (adaptez selon vos besoins)
SESSION_DURATION=24h

# Credentials admin (changez-les immédiatement !)
ADMIN_USERNAME=votre_admin_username
ADMIN_PASSWORD=VotreMotDePasseFortetComplexe2025!

# Tmux
TMUX_SOCKET_PATH=/tmp/tmux-server-watcher
```

### 2. Générer une clé JWT sécurisée

Sur votre serveur Linux :
```bash
# Générer une clé aléatoire forte
openssl rand -base64 48
# Copiez le résultat dans JWT_SECRET
```

### 3. Sécuriser les fichiers

```bash
# Permissions correctes
chmod 600 .env
chmod 600 config/users.json
chmod 755 server/
chmod 755 public/

# Propriétaire correct (remplacez 'user' par votre utilisateur)
chown -R user:user /path/to/mc-server-watcher
```

### 4. Installer les dépendances de production

```bash
# Sur le serveur
cd /path/to/mc-server-watcher
npm install --production
```

### 5. Configuration du pare-feu

```bash
# Si vous utilisez UFW (Ubuntu/Debian)
sudo ufw allow 3000/tcp

# Si vous utilisez firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📦 Déploiement avec systemd (Recommandé)

### Étape 1 : Créer le service systemd

Créez `/etc/systemd/system/mc-watcher.service` :

```ini
[Unit]
Description=MC Server Watcher - Terminal Management System
Documentation=https://github.com/CarrascoAlexis/mc-server-watcher
After=network.target

[Service]
Type=simple
User=votre-utilisateur
Group=votre-groupe
WorkingDirectory=/chemin/complet/vers/mc-server-watcher
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

# Sécurité
NoNewPrivileges=true
PrivateTmp=true

# Logs
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mc-watcher

[Install]
WantedBy=multi-user.target
```

### Étape 2 : Activer et démarrer le service

```bash
# Recharger systemd
sudo systemctl daemon-reload

# Activer le service au démarrage
sudo systemctl enable mc-watcher

# Démarrer le service
sudo systemctl start mc-watcher

# Vérifier le statut
sudo systemctl status mc-watcher

# Voir les logs
sudo journalctl -u mc-watcher -f
```

### Commandes utiles

```bash
# Redémarrer le service
sudo systemctl restart mc-watcher

# Arrêter le service
sudo systemctl stop mc-watcher

# Voir les logs des 100 dernières lignes
sudo journalctl -u mc-watcher -n 100

# Voir les logs en temps réel
sudo journalctl -u mc-watcher -f
```

---

## 🔒 Configuration avec Reverse Proxy (NGINX)

### Installation de NGINX

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### Configuration NGINX

Créez `/etc/nginx/sites-available/mc-watcher` :

```nginx
upstream mc_watcher {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/mc-watcher-access.log;
    error_log /var/log/nginx/mc-watcher-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Limit request size
    client_max_body_size 10M;

    # Application
    location / {
        proxy_pass http://mc_watcher;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://mc_watcher;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### Activer le site

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/mc-watcher /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer NGINX
sudo systemctl restart nginx
```

---

## 🔐 HTTPS avec Let's Encrypt (Certbot)

### Installation de Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### Obtenir un certificat SSL

```bash
# Remplacez par votre domaine
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Suivez les instructions
```

### Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via cron/systemd
```

---

## 📊 Monitoring et Logs

### Voir les logs de l'application

```bash
# Logs systemd
sudo journalctl -u mc-watcher -f

# Logs NGINX
sudo tail -f /var/log/nginx/mc-watcher-access.log
sudo tail -f /var/log/nginx/mc-watcher-error.log
```

### Surveiller les performances

```bash
# Voir l'utilisation CPU/RAM
htop

# Voir les processus Node.js
ps aux | grep node

# Voir les connexions
sudo netstat -tulpn | grep :3000
```

---

## 💾 Backup

### Script de backup automatique

Créez `/usr/local/bin/backup-mc-watcher.sh` :

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mc-watcher"
APP_DIR="/path/to/mc-server-watcher"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup des fichiers de configuration
tar -czf $BACKUP_DIR/mc-watcher-config-$DATE.tar.gz \
    -C $APP_DIR \
    config/ \
    .env

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "mc-watcher-config-*.tar.gz" -mtime +30 -delete

echo "Backup completed: mc-watcher-config-$DATE.tar.gz"
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-mc-watcher.sh

# Ajouter au crontab (tous les jours à 2h du matin)
sudo crontab -e
# Ajouter cette ligne :
0 2 * * * /usr/local/bin/backup-mc-watcher.sh
```

---

## 🔄 Mise à jour de l'application

```bash
# 1. Arrêter le service
sudo systemctl stop mc-watcher

# 2. Backup
sudo /usr/local/bin/backup-mc-watcher.sh

# 3. Mettre à jour le code
cd /path/to/mc-server-watcher
git pull origin main

# 4. Installer les dépendances
npm install --production

# 5. Redémarrer le service
sudo systemctl start mc-watcher

# 6. Vérifier
sudo systemctl status mc-watcher
```

---

## ✅ Checklist finale avant mise en production

- [ ] JWT_SECRET changé avec une valeur forte
- [ ] Mot de passe admin changé
- [ ] .env en mode production (NODE_ENV=production)
- [ ] Permissions fichiers correctes (600 pour .env)
- [ ] Service systemd configuré et activé
- [ ] NGINX configuré (optionnel mais recommandé)
- [ ] HTTPS configuré avec Let's Encrypt
- [ ] Pare-feu configuré
- [ ] Backup automatique configuré
- [ ] Terminals.json configuré avec vos serveurs
- [ ] Premier utilisateur admin créé (npm run init)
- [ ] Application testée et fonctionnelle

---

## 🆘 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
sudo journalctl -u mc-watcher -n 50

# Vérifier si le port est libre
sudo netstat -tulpn | grep :3000

# Vérifier les permissions
ls -la /path/to/mc-server-watcher
```

### WebSocket ne fonctionne pas

```bash
# Vérifier la config NGINX pour WebSocket
sudo nginx -t

# Vérifier les logs NGINX
sudo tail -f /var/log/nginx/error.log
```

### Performance lente

```bash
# Augmenter les workers Node.js (modifier le service)
# Vérifier la RAM disponible
free -h

# Vérifier l'utilisation CPU
top
```

---

## 📞 Support

Pour plus d'informations : README.md

**Bonne mise en production ! 🚀**
