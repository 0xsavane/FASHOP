# FASHOP Backend - Documentation

## Architecture

FASHOP Backend utilise MongoDB comme base de données principale avec Express.js.

## Serveurs Disponibles

### Production (Recommandé)
- **Fichier**: `server-mongodb.js`
- **Base de données**: MongoDB Atlas
- **Fonctionnalités**: Complètes avec schémas, validation, calcul automatique des marges

### Développement/Test
- **Fichier**: `server-simple.js` 
- **Base de données**: Données en mémoire
- **Fonctionnalités**: Basiques pour tests rapides

## Endpoints API

### Fournisseurs
- `GET /api/v1/suppliers` - Liste des fournisseurs
- `POST /api/v1/suppliers` - Créer un fournisseur

### Produits  
- `GET /api/v1/products` - Liste des produits avec filtres
- `GET /api/v1/products/:id` - Détail d'un produit
- `POST /api/v1/products` - Créer un produit

### Commandes
- `GET /api/v1/orders` - Liste des commandes
- `POST /api/v1/orders` - Créer une commande (déclenche SMS fournisseur)

### Compatibilité
- `GET /api/v1/test/*` - Endpoints de compatibilité avec l'ancien système

## Services

### SMS Service
- **Fichier**: `sms-service.js`
- **Fonctionnalité**: Notifications automatiques aux fournisseurs via Twilio
- **Workflow**: Commande → SMS fournisseur → Confirmation

## Configuration

Variables d'environnement dans `.env`:
- `MONGODB_URI` - Connexion MongoDB Atlas
- `TWILIO_*` - Configuration SMS
- `PORT` - Port du serveur (défaut: 5000)

## Démarrage

```bash
# Production avec MongoDB
node server-mongodb.js

# Développement simple
node server-simple.js
```
