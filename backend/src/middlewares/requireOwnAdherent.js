const adherentModel = require('../models/adherentModel');

/// Route protégée par identité : l'adhérent connecté ne peut agir que sur SES participations
/// À placer après authenticateToken (qui remplit req.user)
async function requireOwnAdherent(req, res, next) {
    try {
        /// Retrouver l'adhérent lié au compte du token
        const adherent = await adherentModel.findByCompteId(req.user.id_compte);
        if (!adherent) {
            return res.status(404).json({ message: 'Profil adhérent introuvable pour ce compte' });
        }

        /// Si un id_adherent est fourni (URL ou body), il doit être celui de l'utilisateur connecté
        const idDemande = req.params.id_adherent ?? req.body?.id_adherent;
        if (idDemande !== undefined && Number(idDemande) !== adherent.id_adherent) {
            return res.status(403).json({ message: 'Accès refusé : ce n\'est pas votre inscription' });
        }

        req.adherent = adherent;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = requireOwnAdherent;
