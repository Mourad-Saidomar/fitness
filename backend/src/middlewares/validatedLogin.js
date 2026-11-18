function validatedLogin(req, res, next) {
    const { email, password } = req.body;

    if (typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ error: 'Email requis' });
    }

    if (typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ error: 'Mot de passe requis' });
    }

    next();
}

module.exports = validatedLogin;