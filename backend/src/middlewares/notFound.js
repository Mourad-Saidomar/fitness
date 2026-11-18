const notFound = (req, res) => {
    return res.status(404).json({
        message : 'Route introuvable'
    })
}

module.exports = notFound;