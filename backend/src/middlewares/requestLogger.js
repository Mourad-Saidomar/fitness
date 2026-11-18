const requestLogger = (req, res, next) =>{
    const date = new Date().toISOString();

    console.log(`${date} - ${req.method} ${req.originalUrl}`);

    next();
}

module.exports = requestLogger;