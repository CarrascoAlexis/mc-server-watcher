# 🔒 Notes de Sécurité pour la Production

## ⚠️ IMPORTANT - À FAIRE IMMÉDIATEMENT

### 1. Changez le JWT_SECRET
Le JWT_SECRET par défaut n'est PAS sécurisé. Générez-en un nouveau :

```bash
# Sur votre serveur Linux
openssl rand -base64 48
```

Copiez le résultat dans votre fichier `.env` :
```env
JWT_SECRET=votre_nouvelle_cle_aleatoire_generee
```

### 2. Créez un mot de passe admin fort
Lors de l'exécution de `npm run init`, utilisez un mot de passe fort :
- Minimum 12 caractères
- Mélange de majuscules, minuscules, chiffres et symboles
- Ne réutilisez pas un mot de passe existant

### 3. Configurez NODE_ENV=production
Dans votre `.env` sur le serveur :
```env
NODE_ENV=production
```

Cela active les optimisations et désactive certains logs de debug.

### 4. Protégez vos fichiers sensibles
```bash
chmod 600 .env
chmod 600 config/users.json
```

### 5. Utilisez HTTPS
En production, configurez TOUJOURS HTTPS avec un certificat SSL.
Voir DEPLOYMENT.md pour les instructions avec Let's Encrypt.

---

## 🔐 Recommandations de Sécurité

### Réseau
- [ ] Utilisez un pare-feu (UFW, firewalld)
- [ ] Limitez l'accès au port 3000 (ou utilisez NGINX en reverse proxy)
- [ ] Configurez fail2ban pour bloquer les tentatives de connexion répétées
- [ ] Utilisez HTTPS uniquement (pas de HTTP en production)

### Application
- [ ] Le rate limiting est activé par défaut (100 req/15min par IP)
- [ ] Les mots de passe sont hashés avec bcrypt
- [ ] Les tokens JWT expirent après 24h
- [ ] Helmet.js protège contre les attaques courantes

### Système
- [ ] Créez un utilisateur dédié (ne pas utiliser root)
- [ ] Utilisez systemd pour gérer le service
- [ ] Configurez la rotation des logs
- [ ] Mettez en place des backups automatiques

---

## 📊 Monitoring Recommandé

### Vérifications régulières
1. **Logs du service** : `sudo journalctl -u mc-watcher -f`
2. **Utilisation ressources** : `htop`
3. **Connexions actives** : `sudo netstat -tulpn | grep :3000`
4. **Espace disque** : `df -h`

### Alertes à configurer
- Utilisation CPU > 80%
- Utilisation RAM > 90%
- Espace disque < 10%
- Service down
- Tentatives de connexion échouées répétées

---

## 🔄 Mises à jour

### Avant chaque mise à jour
1. Faites un backup complet
2. Testez sur un environnement de staging si possible
3. Planifiez une fenêtre de maintenance

### Procédure de mise à jour
```bash
# 1. Backup
sudo systemctl stop mc-watcher
tar -czf backup-$(date +%Y%m%d).tar.gz config/ .env

# 2. Update
git pull
npm install --production

# 3. Restart
sudo systemctl start mc-watcher
sudo systemctl status mc-watcher
```

---

## 🚨 En cas de problème

### L'application ne répond plus
```bash
# Redémarrer le service
sudo systemctl restart mc-watcher

# Vérifier les logs
sudo journalctl -u mc-watcher -n 100
```

### Suspicion de compromission
1. Arrêtez immédiatement le service
2. Changez tous les mots de passe
3. Générez un nouveau JWT_SECRET
4. Vérifiez les logs pour activité suspecte
5. Vérifiez config/users.json pour utilisateurs non autorisés

### Récupération après crash
```bash
# Vérifier l'état du service
sudo systemctl status mc-watcher

# Redémarrer
sudo systemctl start mc-watcher

# Si ça ne fonctionne pas, restaurer depuis backup
cd /path/to/mc-server-watcher
tar -xzf backup-YYYYMMDD.tar.gz
sudo systemctl start mc-watcher
```

---

## 📝 Checklist de Maintenance Mensuelle

- [ ] Vérifier les logs d'erreurs
- [ ] Vérifier l'espace disque
- [ ] Mettre à jour les dépendances npm si nécessaire
- [ ] Vérifier les backups
- [ ] Vérifier la liste des utilisateurs actifs
- [ ] Vérifier les certificats SSL (expiration)
- [ ] Revoir les accès aux terminaux
- [ ] Vérifier les performances

---

## 💡 Optimisations

### Pour de meilleures performances
1. **Utilisez PM2** au lieu de node direct (gestion des processus)
2. **Activez la compression** GZIP dans NGINX
3. **Utilisez un CDN** pour les ressources statiques
4. **Configurez le cache** pour les fichiers statiques
5. **Surveillez les métriques** avec des outils comme Prometheus/Grafana

### Limites recommandées
- Max 100 utilisateurs simultanés par défaut
- Max 10 terminaux par utilisateur
- Session timeout : 24h (ajustable dans .env)

---

## 🆘 Support et Documentation

- **README.md** : Documentation complète
- **DEPLOYMENT.md** : Guide de déploiement détaillé
- **QUICKSTART.md** : Démarrage rapide
- **SECURITY.md** : Ce fichier

Pour toute question de sécurité critique, ouvrez une issue sur GitHub.
