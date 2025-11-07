# Makefile pour MC Server Watcher
# Simplifie les commandes courantes

.PHONY: help install init start dev stop restart logs check deploy

help: ## Affiche cette aide
	@echo "╔════════════════════════════════════════════════════╗"
	@echo "║  MC Server Watcher - Commandes disponibles        ║"
	@echo "╚════════════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Installer les dépendances
	@echo "📦 Installation des dépendances..."
	npm install

init: ## Créer l'utilisateur admin initial
	@echo "👤 Création de l'utilisateur admin..."
	npm run init

start: ## Démarrer l'application
	@echo "🚀 Démarrage de l'application..."
	npm start

dev: ## Démarrer en mode développement
	@echo "🔧 Démarrage en mode développement..."
	npm run dev

check: ## Vérifier la configuration avant déploiement
	@echo "🔍 Vérification de la configuration..."
	@bash check-deployment.sh

# Commandes systemd (nécessitent sudo)
service-start: ## Démarrer le service systemd
	@echo "▶️  Démarrage du service..."
	sudo systemctl start mc-watcher

service-stop: ## Arrêter le service systemd
	@echo "⏹️  Arrêt du service..."
	sudo systemctl stop mc-watcher

service-restart: ## Redémarrer le service systemd
	@echo "🔄 Redémarrage du service..."
	sudo systemctl restart mc-watcher

service-status: ## Voir le statut du service
	@sudo systemctl status mc-watcher

service-enable: ## Activer le service au démarrage
	@echo "✅ Activation du service au démarrage..."
	sudo systemctl enable mc-watcher

service-logs: ## Voir les logs du service
	@sudo journalctl -u mc-watcher -f

# Maintenance
backup: ## Créer une sauvegarde
	@echo "💾 Création d'une sauvegarde..."
	@mkdir -p backups
	@tar -czf backups/backup-$$(date +%Y%m%d-%H%M%S).tar.gz config/ .env
	@echo "✅ Sauvegarde créée dans backups/"

clean: ## Nettoyer les fichiers temporaires
	@echo "🧹 Nettoyage..."
	@rm -rf node_modules
	@rm -f *.log
	@echo "✅ Nettoyage terminé"

update: ## Mettre à jour les dépendances
	@echo "🔄 Mise à jour des dépendances..."
	npm update
	@echo "✅ Mise à jour terminée"
