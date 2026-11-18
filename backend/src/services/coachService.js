const coachModel = require('../models/coachModel');
const utilisateurModel = require('../models/utilisateurModel');
const authModel = require('../models/authModel');
const withTransaction = require('../config/transaction');

/// Créer un coach (par l'admin) : utilisateur + coach, sans compte
/// Le compte se crée ensuite avec POST /auth/register/coach/:id
async function createCoach(data){
    const id_coach = await withTransaction(async (connection) => {
        const id_utilisateur = await utilisateurModel.create(data, connection);
        return coachModel.create({...data, id_utilisateur}, connection);
    });

    const coach = await coachModel.findById(id_coach);
    return {success: true, data: coach};
}

/// Modifier un coach : infos personnelles (utilisateur) + spécialité (coach)
/// coach : le coach déjà trouvé (par id ou par compte)
async function updateCoachData(coach, data){
    await withTransaction(async (connection) => {
        await utilisateurModel.update(coach.id_utilisateur, data, connection);
        await coachModel.update(coach.id_coach, data, connection);
    });

    return {success: true, data: await coachModel.findById(coach.id_coach)};
}

/// Modifier un coach par son id (par l'admin)
async function updateCoach(id, data){
    const coach = await coachModel.findById(id);
    if (!coach) return {success: false, error: 'INTROUVABLE'};

    return updateCoachData(coach, data);
}

/// Modifier SON profil (par le coach connecté)
async function updateMyProfile(id_compte, data){
    const coach = await coachModel.findByCompteId(id_compte);
    if (!coach) return {success: false, error: 'INTROUVABLE'};

    return updateCoachData(coach, data);
}

/// Supprimer un coach :
/// supprimer l'utilisateur → ON DELETE CASCADE supprime le coach et ses séances
/// puis supprimer son compte s'il en a un
async function deleteCoach(id){
    const coach = await coachModel.findById(id);
    if (!coach) return {success: false, error: 'INTROUVABLE'};

    await withTransaction(async (connection) => {
        await utilisateurModel.remove(coach.id_utilisateur, connection);
        if (coach.id_compte) await authModel.remove(coach.id_compte, connection);
    });

    return {success: true};
}

module.exports = {
    createCoach,
    updateCoach,
    updateMyProfile,
    deleteCoach
}
