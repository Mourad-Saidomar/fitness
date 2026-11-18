const seanceModel = require('../models/seanceModel');
const coachModel = require('../models/coachModel');

async function createSeance(data){
    const {date_seance, heure_debut, heure_fin, capacite_max, id_coach, id_salle, places_restantes} = data;
    
    ///Verifier les champs obligatoires
    if (!date_seance || !heure_debut || !heure_fin 
        || !capacite_max || !id_coach || !id_salle || !places_restantes){
            return {success: false, error: 'CHAMPS_OBLIGATOIRES'};
        }

    ///vérifier si la capacité maximale est supérieure à 5
    const capaciteMax = Number(capacite_max);
    if(capaciteMax<5){
        return {success: false, error: 'CAP_MAX_INVALIDE'};
    }
    
    ///vérifier si la date et heure de b=début sont postérieures à la date actuelle
    const maintenant = new Date();
    const [h, m, s] = heure_debut.split(':').map(Number);
    const dateSeanceObject = new Date(date_seance);
    dateSeanceObject.setHours(h, m, s);

    if(dateSeanceObject<maintenant){

        return {success: false, error: 'DATE_NON_VALIDE'};
    }

    ///Un coach ne peut animer deux qui chevauchent
    const existingSeance = await coachModel.findSeanceCoachByDate(id_coach, date_seance, heure_debut, heure_fin);
    if (existingSeance) return {success: false, error: 'COACH_INVALIDE'};
    
    ///Création d'une séance 
    const seance = await seanceModel.createSeance(data);
    return {success: true, data: seance};
    
}

module.exports = {
    createSeance
}