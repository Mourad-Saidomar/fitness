const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController.js');
const validateId = require('../middlewares/validateId.js');
const validateUtilisateurBody = require('../middlewares/validateUtilisateurBody.js');
const authenticateToken = require('../middlewares/authenticateToken.js');
const requireRole = require('../middlewares/requireRole.js');
const requireDroit = require('../middlewares/requireDroit.js');

 
// ROUTES PROTÉGÉES PAR IDENTITÉ (l'utilisateur connecté accède à SES données)
// À déclarer AVANT /:id, sinon Express prendrait "me" pour un id

// GET /coachs/me — Un coach consulte SON profil
router.get('/me', authenticateToken, requireRole('COACH'), requireDroit('voir_profil'), coachController.getMyProfile);

// PUT /coachs/me — Un coach modifie SON profil (champs envoyés uniquement)
router.put('/me', authenticateToken, requireRole('COACH'), requireDroit('modifier_profil'), coachController.updateMyProfile);

// ROUTES PUBLIQUES (tout le monde peut voir la liste des coachs)

// GET /coachs — Liste de tous les coachs (public)
router.get('/', coachController.getAllCoachs);

// GET /coachs/:id — Voir un coach par ID (public)
router.get('/:id', validateId, coachController.getCoachById);

// ROUTES PROTÉGÉES PAR DROIT (la table droit décide qui a accès)

// POST /coachs — Droit creer_coach (ADMIN)
router.post('/', authenticateToken, requireDroit('creer_coach'), validateUtilisateurBody, coachController.createCoach);

// PUT /coachs/:id — Droit modifier_coach (ADMIN) (champs envoyés uniquement)
router.put('/:id', authenticateToken, requireDroit('modifier_coach'), validateId, coachController.updateCoach);

// DELETE /coachs/:id — Droit supprimer_coach (ADMIN)
router.delete('/:id', authenticateToken, requireDroit('supprimer_coach'), validateId, coachController.deleteCoach);

module.exports = router;
