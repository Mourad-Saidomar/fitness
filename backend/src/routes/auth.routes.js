const express = require('express');
const router = express.Router();
const validateRegister = require('../middlewares/validateRegister');
const validateUtilisateurBody = require('../middlewares/validateUtilisateurBody');
const validateId = require('../middlewares/validateId');
const validatedLogin = require('../middlewares/validatedLogin');
const authController = require('../controllers/authController');
const authenticateToken = require('../middlewares/authenticateToken');
const requireDroit = require('../middlewares/requireDroit');

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

// POST /auth/login — Connexion, un seul login pour tous les rôles (publique)
router.post('/login', validatedLogin, authController.login);

// POST /auth/register — Inscription : crée compte + utilisateur + adherent (publique)
router.post('/register', validateRegister, validateUtilisateurBody, authController.register);

// ============================================================
// ROUTES PROTÉGÉES PAR DROIT (gerer_comptes → admin)
// ============================================================

// POST /auth/register/adherent/:id — Créer un compte pour un adhérent existant
router.post('/register/adherent/:id', authenticateToken, requireDroit('gerer_comptes'), validateId, validateRegister, authController.createCompteAdherent);

// POST /auth/register/coach/:id — Créer un compte pour un coach existant
router.post('/register/coach/:id', authenticateToken, requireDroit('gerer_comptes'), validateId, validateRegister, authController.createCompteCoach);

module.exports = router;
