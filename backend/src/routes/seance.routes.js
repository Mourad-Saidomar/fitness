const express = require('express');
const router = express.Router();
const seanceController = require('../controllers/seanceController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireDroit = require('../middlewares/requireDroit');

// ============================================================
// ROUTE PUBLIQUE
// ============================================================

// GET /seances — Tout le monde peut voir les séances (publique)
router.get('/', seanceController.getAllSeances);

// ============================================================
// ROUTES PROTÉGÉES PAR DROIT
// ============================================================

// POST /seances — Droit creer_seance (COACH, ADMIN)
router.post('/', authenticateToken, requireDroit('creer_seance'), seanceController.createSeance);

module.exports = router;