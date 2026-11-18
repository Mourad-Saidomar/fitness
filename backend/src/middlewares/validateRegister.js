/// Vérifier les identifiants de connexion envoyés pour créer un compte
/// Même nom de champ que le login : "password" (en clair, il sera hashé par le service)
const validateRegister = (req, res, next) => {
    const {
        email,
        password
    } = req.body;

    const champsManquants = [];
    if(typeof email !== 'string' || !email.trim()) champsManquants.push('email');
    if(typeof password !== 'string' || !password.trim()) champsManquants.push('password');

    if (champsManquants.length > 0){

        return res.status(400).json({
            message: 'champs obligatoires manquants',
            champs: champsManquants
        })
    }

    next();
}

module.exports = validateRegister;
