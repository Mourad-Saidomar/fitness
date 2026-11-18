const errorHandler = (err, req, res, next) => {
    console.log(err);
    if (res.headersSent){
        return next(err);
    }

    return res.status(500).json({
        message: 'Erreur interne du serveur'
    })


}

module.exports = errorHandler;