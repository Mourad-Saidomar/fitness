const adherentModel = require('../models/adherentModel');
const utilisateurModel = require('../models/utilisateurModel');
const authModel = require('../models/authModel');
const withTransaction = require('../config/transaction');

/// Créer un adhérent (par l'admin) : utilisateur + adherent, sans compte
/// Le compte se crée ensuite avec POST /auth/register/adherent/:id
async function createAdherent(data){
    const id_adherent = await withTransaction(async (connection) => {
        const id_utilisateur = await utilisateurModel.create(data, connection);
        return adherentModel.create({...data, id_utilisateur}, connection);
    });

    const adherent = await adherentModel.findById(id_adherent);
    return {success: true, data: adherent};
}

/// Modifier un adhérent (par l'admin) : tous les champs
async function updateAdherent(id, data){
    const adherent = await adherentModel.findById(id);
    if (!adherent) return {success: false, error: 'INTROUVABLE'};

    await withTransaction(async (connection) => {
        await utilisateurModel.update(adherent.id_utilisateur, data, connection);
        await adherentModel.update(id, data, connection);
    });

    return {success: true, data: await adherentModel.findById(id)};
}

/// Modifier SON profil (par l'adhérent connecté)
/// Il peut changer ses infos personnelles, son poids et son IMC,
/// mais pas son abonnement ni son contrat (c'est le rôle de l'admin)
async function updateMyProfile(id_compte, data){
    const adherent = await adherentModel.findByCompteId(id_compte);
    if (!adherent) return {success: false, error: 'INTROUVABLE'};

    const {poids, imc} = data;

    await withTransaction(async (connection) => {
        await utilisateurModel.update(adherent.id_utilisateur, data, connection);
        await adherentModel.update(adherent.id_adherent, {poids, imc}, connection);
    });

    return {success: true, data: await adherentModel.findById(adherent.id_adherent)};
}

/// Supprimer un adhérent :
/// supprimer l'utilisateur → ON DELETE CASCADE supprime l'adhérent et ses participations
/// puis supprimer son compte s'il en a un
async function deleteAdherent(id){
    const adherent = await adherentModel.findById(id);
    if(!adherent) return {success: false, error: 'INTROUVABLE'};

    await withTransaction(async (connection) => {
        await utilisateurModel.remove(adherent.id_utilisateur, connection);
        if (adherent.id_compte) await authModel.remove(adherent.id_compte, connection);
    });

    return {success: true};
}


module.exports = {
    createAdherent,
    updateAdherent,
    updateMyProfile,
    deleteAdherent
}
