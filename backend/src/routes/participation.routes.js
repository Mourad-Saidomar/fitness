const express = require('express');
const router = express.Router();
const participationController = require('../controllers/participationController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireDroit = require('../middlewares/requireDroit');
const requireOwnAdherent = require('../middlewares/requireOwnAdherent');

router.get('/:id_adherent/:id_seance', (req, res, next) =>{
    console.log('router participation');
    next();
},  participationController.getParticipationAdherent);

// ============================================================
// ROUTES PROTÉGÉES PAR IDENTITÉ (l'adhérent n'agit que sur SES inscriptions)
// ============================================================

// POST /participations — Un adhérent s'inscrit lui-même à une séance
router.post('/', authenticateToken, requireDroit('inscription_seance'), requireOwnAdherent, participationController.inscrireAdherent);

// DELETE /participations/:id_adherent/:id_seance — Un adhérent annule SA propre inscription
router.delete('/:id_adherent/:id_seance', authenticateToken, requireDroit('annuler_inscription'), requireOwnAdherent, participationController.annulerInscription);

// ============================================================
// ROUTE PROTÉGÉE PAR DROIT
// ============================================================

// PUT /participations/:id_adherent/:id_seance — Droit enregistrer_presence (COACH, ADMIN)
router.put('/:id_adherent/:id_seance', authenticateToken, requireDroit('enregistrer_presence'), participationController.enregistrerPresence);

module.exports = router;
