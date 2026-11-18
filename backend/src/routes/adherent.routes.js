const express = require('express');
const router = express.Router();
const adherentController = require('../controllers/adherentController.js');
const validateId = require('../middlewares/validateId.js');
const validateUtilisateurBody = require('../middlewares/validateUtilisateurBody.js');
const authenticateToken = require('../middlewares/authenticateToken.js');
const requireRole = require('../middlewares/requireRole.js');
const requireDroit = require('../middlewares/requireDroit.js');

// ROUTES PROTÉGÉES PAR IDENTITÉ (l'utilisateur connecté accède à SES données)

// GET /adherents/me — Un adhérent consulte SON profil
router.get('/me', authenticateToken, requireRole('ADHERENT'), requireDroit('voir_profil'), adherentController.getMyProfile);

// PUT /adherents/me — Un adhérent modifie SON profil (champs envoyés uniquement)
router.put('/me', authenticateToken, requireRole('ADHERENT'), requireDroit('modifier_profil'), adherentController.updateMyProfile);

// ROUTES PROTÉGÉES PAR DROIT (la table droit décide qui a accès)

// GET /adherents — Droit voir_adherents (COACH, ADMIN)
router.get('/', authenticateToken, requireDroit('voir_adherents'), adherentController.getAllAdherents);

// GET /adherents/:id — Droit voir_adherents (COACH, ADMIN)
router.get('/:id', authenticateToken, requireDroit('voir_adherents'), validateId, adherentController.getAdherentById);

// POST /adherents — Droit creer_adherent (ADMIN)
router.post('/', authenticateToken, requireDroit('creer_adherent'), validateUtilisateurBody, adherentController.createAdherent);

// PUT /adherents/:id — Droit modifier_adherent (ADMIN) (champs envoyés uniquement)
router.put('/:id', authenticateToken, requireDroit('modifier_adherent'), validateId, adherentController.updateAdherent);

// DELETE /adherents/:id — Droit supprimer_adherent (ADMIN)
router.delete('/:id', authenticateToken, requireDroit('supprimer_adherent'), validateId, adherentController.deleteAdherent);

module.exports = router;
