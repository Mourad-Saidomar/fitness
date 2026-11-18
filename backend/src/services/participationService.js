const participationModel = require('../models/participationModel');
const seanceModel = require('../models/seanceModel');
const adherentModel = require('../models/adherentModel');

///Inscrire un adherent
///1. vérifier si l'adherent s'est déjà inscrit à la séance
///2. Vérifier si la séance dispose d'une place libre
///3. Vérifier si la séance a déjà commencé
async function inscrireAdherent(data){
    const {id_adherent, id_seance, present} = data;

    //vérifier si l'adherent existe
    const adherent = await adherentModel.findById(id_adherent);
    if(!adherent) return {success: false, error: 'ADHERENT_NON_TROUVE'};

    //vérifier si l'adherent s'est déjà inscrit à la séance
    const adherentSeance = await participationModel.getAdherentSeance(id_adherent, id_seance);
    if (adherentSeance) return {success: false, error: 'ADHERENT_DEJA_INSCRIT'};

    //Vérifier si la séance dispose d'une place restante
    const seance = await seanceModel.findById(id_seance);
    if (seance){
        if (seance.places_restantes <=0) return {success: false, error: 'AUCUNE_PLACE'};
        //vérifier si la séance a déjà commencé
        const dateSeance = new Date(seance.date_seance);
        const [h, m, s] = seance.heure_debut.split(':').map(Number);
        dateSeance.setHours(h, m, s);
        const maintenant = new Date();
        if(dateSeance<maintenant){
            return {success: false, error: 'SEANCE_COMMENCEE'};
        }
    }

    //Insérer une séance
    const participation = await participationModel.inscrireAdherent(data);
    //mettre à jour le nombre des places restantes 
    if (participation){
        const nbPlaceDispo = Number(seance.places_restantes) - 1;
        await seanceModel.updateNbPlaceDispo(id_seance, nbPlaceDispo);
    }
    return {success: true, data: participation};

}

///Annuler une inscription
///1. Vérifier si l'adhérent est bien inscrit à la séance
///2. Vérifier si la séance a déjà commencé
async function annulerInscription(id_adherent, id_seance){
    //vérifier si l'adherent est inscrit à la séance
    const adherentSeance = await participationModel.getAdherentSeance(id_adherent, id_seance);
    if(!adherentSeance) return {success: false, error: 'ADHERENT_NON_INSCRIT'};

    //vérifier si la séance a déjà commencé
    const seance = await seanceModel.findById(id_seance);
    if (seance){
        //vérifier si la séance a déjà commencé
        const dateSeance = new Date(seance.date_seance);
        const [h, m, s] = seance.heure_debut.split(':').map(Number);
        dateSeance.setHours(h, m, s);
        const maintenant = new Date();
        if(dateSeance<maintenant){
            return {success: false, error: 'SEANCE_COMMENCEE'};
        }
    }

    //Annuler l'inscription d'un adherent
    const affectedRows = await participationModel.annulerInscription(id_adherent, id_seance);
    if (affectedRows > 0) return {success: true};

    const participation = await participationModel.getAdherentSeance(id_adherent, id_seance);
    if (participation) return {success: true}
    else return {success: false, error: 'ANNULATION_NON_REUSSIE'};
    
}

///Enregistrer une présence
//est ce que la séance a déjà démarré
async function enregistrerPresence(id_adherent, id_seance){
    
    //Vérifier si la séance existe
    const seance = await seanceModel.findById(id_seance);
    if(!seance) return {success: false, error: 'SEANCE_NON_TROUVEE'};
    

    //Vérifier si la date et l'heure permettent d'effectuer la mise à jour sur la présence
    const dateActuelle = new Date();
    const dateSeanceDebut = new Date(seance.date_seance);
    const [h, m, s] = seance.heure_debut.split(':').map(Number);
    dateSeanceDebut.setHours(h, m, s);
    const dateSeanceFin = new Date(seance.date_seance);
    const [hh, mm, ss] = seance.heure_fin.split(':').map(Number);
    dateSeanceFin.setHours(hh,mm,ss);
    if (dateActuelle<dateSeanceDebut || dateActuelle>dateSeanceFin) return {success: false, error: 'DATE_PRESENCE_NON_VALIDE'};
    
    //mettre à jour la présence
    await participationModel.enregistrerPresence(id_adherent, id_seance);

    return {success : true};
}   

module.exports = {
    inscrireAdherent,
    annulerInscription,
    enregistrerPresence
}