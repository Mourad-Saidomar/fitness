const abonnementModel = require('../models/abonnementModel');

async function createAbonnement(data){
    const {nom, duree_mois, tarif} = data;
    
    //Vérifier les champs
    if(!nom || !duree_mois || !tarif){
        return {success: false, error: 'CHAMPS_OBLIGATOIRES'};
    }

    //Vérifier la durée
    const duree = Number(duree_mois);
    if(duree<=0) return {success: false, error: 'DUREE_NON_VALIDE'};

    //vérifier le tarif
    const tarif_abonnement = Number(tarif);
    if (tarif_abonnement<=0) return {success: false, error: 'TARIF_NON_VALIDE'};

    //vérifier si le nom est déjà utilisé
    const existing = await abonnementModel.findAbonnementByName(nom);
    if(existing) return {success: false, error: 'NOM_PRIS'}

    //Créer un abonnement
    const abonnement = await abonnementModel.createAbonnement(data);
    return {success: true, data:abonnement}

}

module.exports = {
    createAbonnement
}