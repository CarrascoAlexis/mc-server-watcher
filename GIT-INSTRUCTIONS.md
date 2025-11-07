# 🎉 Instructions pour votre premier commit Git

## Étapes pour pousser le code sur GitHub

### 1. Vérifier le statut Git

```bash
git status
```

### 2. Ajouter tous les fichiers

```bash
git add .
```

### 3. Créer le commit initial

```bash
git commit -m "Initial commit: MC Server Watcher - Terminal Management System

- Complete web application for managing tmux terminals
- Secure authentication with JWT
- Admin panel for user management
- Real-time terminal interaction with WebSocket
- Full documentation and deployment guides"
```

### 4. Pousser vers GitHub

```bash
git push origin main
```

Si c'est votre premier push, vous devrez peut-être configurer la branche :

```bash
git branch -M main
git push -u origin main
```

## 📝 Structure du projet poussée

Voici ce qui sera envoyé sur GitHub :

```
✅ Code source complet
✅ Documentation (README, DEPLOYMENT, etc.)
✅ Configuration exemple (.env.example)
✅ Scripts d'installation
✅ Fichiers de service systemd
✅ .gitignore (fichiers sensibles exclus)

❌ .env (fichier local uniquement)
❌ config/users.json (données sensibles)
❌ node_modules/ (dépendances)
```

## 🔒 Sécurité

Les fichiers sensibles suivants ne seront PAS poussés (grâce au .gitignore) :

- `.env` - Vos variables d'environnement
- `config/users.json` - Base de données utilisateurs
- `node_modules/` - Dépendances npm

## ✅ Vérification avant push

Vérifiez que les fichiers sensibles ne sont pas inclus :

```bash
# Voir ce qui sera commité
git status

# Vérifier que .env n'est PAS listé
# Vérifier que config/users.json n'est PAS listé
```

## 🎯 Après le push

1. Allez sur GitHub : https://github.com/CarrascoAlexis/mc-server-watcher
2. Vérifiez que tout est bien là
3. Le README.md s'affichera automatiquement
4. Vous pouvez maintenant cloner ce repo sur votre serveur !

## 📦 Déployer depuis GitHub

Sur votre serveur :

```bash
# Cloner le repo
git clone https://github.com/CarrascoAlexis/mc-server-watcher.git
cd mc-server-watcher

# Suivre les instructions du DEPLOY-RESUME.md
```

C'est tout ! 🚀
