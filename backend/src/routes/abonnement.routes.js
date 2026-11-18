const express = require('express');
const router = express.Router();
const abonnementController = require('../controllers/abonnementController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireDroit = require('../middlewares/requireDroit');

// ============================================================
// ROUTE PUBLIQUE
// ============================================================

// GET /abonnements — Tout le monde peut voir les abonnements (publique)
router.get('/', abonnementController.getAllAbonnement);

// ============================================================
// ROUTE PROTÉGÉE PAR DROIT
// ============================================================

// POST /abonnements — Droit gerer_abonnements (ADMIN)
router.post('/', authenticateToken, requireDroit('gerer_abonnements'), abonnementController.createAbonnement);

module.exports = router;