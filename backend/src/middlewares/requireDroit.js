const droitModel = require('../models/droitModel');

/// Route protégée par droit : on ne regarde plus le nom du rôle en dur,
/// on demande à la table droit si le rôle de l'utilisateur possède la permission
/// À placer après authenticateToken (qui remplit req.user)
function requireDroit(nomDroit) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authorisation requise' });
        }

        try {
            const autorise = await droitModel.roleHasDroit(req.user.role, nomDroit);
            if (!autorise) {
                return res.status(403).json({ message: `Accès refusé : droit "${nomDroit}" requis` });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = requireDroit;
