const abonnementService = require('../services/abonnementService');
const abonnementModel = require('../models/abonnementModel');

const getAllAbonnement = async(req, res) =>{
    try{
        const abonnements = await abonnementModel.getAllAbonnement();
        res.json(abonnements);
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message: 'Erreur interne du serveur',
            error: err.message
        })
    }
}

const createAbonnement = async (req, res) =>{
    try{
        const result = await abonnementService.createAbonnement(req.body);
        if(!result.success){
            if(result.error == 'CHAMPS_OBLIGATOIRES') return res.status(400).json({message: 'Champs requis'});
            if(result.error == 'DUREE_NON_VALIDE') return res.status(400).json({message: 'La durée doit être positive'});
            if(result.error == 'TARIF_NON_VALIDE') return res.status(400).json({message: 'Le tarif doit être supérieur ou égal à zéro'});
            if(result.error == 'NOM_PRIS') return res.status(409).json({message: 'nom déjà utilisé'});
        }
        
        res.status(200).json(result.data);
       
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message: 'Erreur interne du serveur',
            error: err.message
        });
    }
};

module.exports = {
    createAbonnement,
    getAllAbonnement
}