const participationService = require('../services/participationService');
const participationModel = require('../models/participationModel');

const getParticipationAdherent = async (req, res) =>{
    const {id_adherent, id_seance} = req.params;
    try{
        const participation = await participationModel.getParticipationAdherent(id_adherent, id_seance);
        if(!participation) return res.status(404).json('adherent non trouvé');
        return res.status(200).json(participation);
    }
    catch(err){
        console.log(err.message);
        return res.status(500).json({
            message: 'Erreur interne du serveur',
            error : err.message});
    }
}

///Inscrire un adhérent à une séance
const inscrireAdherent = async (req, res) =>{
    try{
        /// L'id_adherent vient du token (via requireOwnAdherent), pas du body
        /// Un adhérent qui s'inscrit n'est pas encore présent
        const data = {
            id_seance: req.body.id_seance,
            id_adherent: req.adherent.id_adherent,
            present: 0
        };
        const result = await participationService.inscrireAdherent(data);
        
        if(!result.success){
            if(result.error == 'ADHERENT_NON_TROUVE') return res.status(404).json({message: 'Adhérent non trouvé'});
            if(result.error == 'ADHERENT_DEJA_INSCRIT') return res.status(400).json({message: 'Adherent déjà isncrit à la séance'});
            if(result.error == 'AUCUNE_PLACE') return res.status(400).json({message: 'il, n`y a aucune place disponible'});
            if(result.error == 'SEANCE_COMMENCEE') return res.status(400).json({message: 'Impossible de s`inscrire : La séance a déjà commencé'});
        }

        res.status(201).json(result.data);
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message : 'Erreur interne du serveur',
            error: err.message
        });
    }
}

///Annuler l'inscription d'un adherent à une séance
const annulerInscription = async (req, res) =>{
    try{
        const {id_adherent, id_seance} = req.params;
        console.log("sqfq");
        const result = await participationService.annulerInscription(id_adherent, id_seance);
        console.log("succcess :", result.success);
        if (!result.success){
            if(result.error == 'ADHERENT_NON_INSCRIT') return res.status(400).json({message: 'Adherent non inscrit à la séance'});
            if(result.error == 'SEANCE_COMMENCEE') return res.status(400).json({message : 'La séance a déjà commencée'});
            if(result.error == 'INSCRIPTION_NON_TROUVEE') return res.status(400).json({message: 'Inscription non  trouvée'});
            if(result.error == 'ANNULATION_NON_REUSSIE') return res.status(400).json({message: 'Echec de l`annulation de l`inscription'})
        }
        res.status(200).json({message: 'L`inscription de l`adhérent a bien été annulée'});
    }
    catch(err){
        console.log(err.message);
        res.status(500).json({
            message : 'Erreur interne du serveur',
            error: err.message
        });
    }
}

//enregistrer la présence
const enregistrerPresence = async (req, res) => {
    try{
        const {id_adherent, id_seance} = req.params;

        const result = await participationService.enregistrerPresence(id_adherent, id_seance);
        if (!result.success){
            if(result.error == 'SEANCE_NON_TROUVEE') return res.status(404).json({message: 'la séance n`a pas été trouvée'});
            if(result.error == 'DATE_PRESENCE_NON_VALIDE') return res.status(400).json({message: 'La date et l`heure ne sont pas valides pour enregistrer la présence'});
        }

        res.status(200).json({message: 'la présence a bien été mise à jour'});
    }
    catch(err){
            res.status(500).json({
            message: 'Erreur interne du serveur',
            error: err.message
        })
    }
}

module.exports = {
    inscrireAdherent,
    getParticipationAdherent,
    annulerInscription,
    enregistrerPresence
}