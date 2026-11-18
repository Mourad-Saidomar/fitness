const tokenService = require('../services/tokenService');

function authenticateToken(req, res, next) {
    const authorization = req.headers['authorization'];
    if (!authorization) {
        return res.status(401).json({ message: 'Authorisation requise' });
    }   

    const [schema, token, extra] = authorization.trim().split(/\s+/);
    if (schema !== 'Bearer' || !token || extra) {
        return res.status(401).json({ message: 'Jeton invalide' });
    }

    try {
        const payload = tokenService.verifyAccessToken(token);
        if (!payload.role || !payload.sub) {
            return res.status(401).json({ message: 'Jeton invalide' });
        }
        req.user = {
            id_compte: Number(payload.sub),
            role: payload.role
        };
        console.log('req.user:', JSON.stringify(req.user));
        return next();
    } catch (error) {
        const jwtErrors = ['JsonWebTokenError', 'TokenExpiredError' ];
        if (jwtErrors.includes(error.name))
            return res.status(401).json({ message: 'Jeton invalide ou expiré' });
        return next(error);
    }
}

module.exports = authenticateToken;