const authService = require('../services/authService');

/// Traduire les erreurs du service en réponses HTTP
function sendError(res, error){
    if (error == 'EMAIL_UTILISE') return res.status(409).json({message: 'Email déjà utilisé'});
    if (error == 'COMPTE_EXISTANT') return res.status(409).json({message: 'Cette personne a déjà un compte'});
    if (error == 'INTROUVABLE') return res.status(404).json({message: 'Personne introuvable'});
    return res.status(400).json({message: error});
}

/// POST /auth/register — Inscription publique (devient ADHERENT)
const register = async (req, res, next) => {
    try{
        const result = await authService.register(req.body);
        if(!result.success) return sendError(res, result.error);

        return res.status(201).json(result.data);
    }
    catch(err){
        next(err);
    }
}

/// POST /auth/register/adherent/:id — Créer un compte pour un adhérent existant
const createCompteAdherent = async (req, res, next) => {
    try{
        const result = await authService.createAccountAdherent(req.validateId, req.body);
        if(!result.success) return sendError(res, result.error);

        return res.status(201).json(result.data);
    }
    catch(err){
        next(err);
    }
}

/// POST /auth/register/coach/:id — Créer un compte pour un coach existant
const createCompteCoach = async (req, res, next) => {
    try{
        const result = await authService.createAccountCoach(req.validateId, req.body);
        if(!result.success) return sendError(res, result.error);

        return res.status(201).json(result.data);
    }
    catch(err){
        next(err);
    }
}

/// POST /auth/login — Le rôle ne vient pas du body, il vient de la BDD
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const resultat = await authService.login(email, password);
        if (!resultat.success) {
            return res.status(401).json({ message: resultat.error });
        }
        return res.status(200).json(resultat);
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    createCompteAdherent,
    createCompteCoach,
    login
}
