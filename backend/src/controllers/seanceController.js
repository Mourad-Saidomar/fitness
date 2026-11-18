const seanceModel = require('../models/seanceModel');
const seanceService = require('../services/seanceService');

const getAllSeances = async (req, res) => {
    try{
        const seances = await seanceModel.getAllSeances()
        return res.json(seances);
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message : 'Erreur interne du serveur',
            error: err.message});
    }
}

const createSeance = async (req, res) => {
    try{
        const result = await seanceService.createSeance(req.body);
        if (!result.success){
            if(result.error == 'CHAMPS_OBLIGATOIRES') return res.status(400).json({message: 'Champs requis'});
            if(result.error == 'CAP_MAX_INVALIDE') return res.status(400).json({message: 'La valeur de la capacité maximale est invalide'});
            if(result.error == 'DATE_NON_VALIDE') return res.status(400).json({message : 'La date et l"heure de la séance doit être postérieure à la date actuelle'});
            if(result.error == 'COACH_INVALIDE') return res.status(400).json({message : 'Une séance est déjà prévue pour le coach sélectionné à cette date'})
        }
        
        return res.status(201).json(result.data);
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message : 'Erreur interne du serveur',
            error: err.message
        })
    }
}

module.exports = {
    getAllSeances,
    createSeance
}