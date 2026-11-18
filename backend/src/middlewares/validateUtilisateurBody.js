/// Vérifier les informations personnelles obligatoires de la table utilisateur
/// Utilisé pour l'inscription, la création d'un adhérent et la création d'un coach
const validateUtilisateurBody = (req, res, next) => {
    const {
        nom,
        prenom,
        date_naissance,
        adresse
    } = req.body;

    const champsManquants = [];
    if(typeof nom !== 'string' || !nom.trim()) champsManquants.push('nom');
    if(typeof prenom !== 'string' || !prenom.trim()) champsManquants.push('prenom');
    if(typeof date_naissance !== 'string' || !date_naissance.trim()) champsManquants.push('date_naissance');
    if(typeof adresse !== 'string' || !adresse.trim()) champsManquants.push('adresse');

    if (champsManquants.length > 0){

        return res.status(400).json({
            message: 'champs obligatoires manquants',
            champs: champsManquants
        })
    }

    next();
}

module.exports = validateUtilisateurBody;
