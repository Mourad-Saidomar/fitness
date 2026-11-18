const validateId = (req, res, next) =>{
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0)
        return res.status(400).json({message: 'identifiant invalide'});
    
    req.validateId = id;

    next();
}

module.exports = validateId;