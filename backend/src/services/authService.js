const authModel = require('../models/authModel');
const utilisateurModel = require('../models/utilisateurModel');
const adherentModel = require('../models/adherentModel');
const coachModel = require('../models/coachModel');
const tokenService = require('./tokenService');
const withTransaction = require('../config/transaction');
const bcrypt = require('bcrypt');

function normalizeEmail(email){
    return email.trim().toLowerCase();
}

/// Inscription publique : une personne crée elle-même son compte
/// Elle devient ADHERENT. On crée en une seule transaction :
///   1. compte      (email + mot de passe hashé + rôle ADHERENT)
///   2. utilisateur (infos personnelles, relié au compte)
///   3. adherent    (relié à l'utilisateur)
async function register(data){
    const email = normalizeEmail(data.email);

    ///Vérifier si le mail existe déjà dans la base
    const existingUser = await authModel.findByEmail(email);
    if (existingUser) {
        return {success: false, error: 'EMAIL_UTILISE'};
    }

    ///créer l'empreinte du mot de passe avant de l'enregistrer dans la base
    const password_hash = await bcrypt.hash(data.password, 10);

    const result = await withTransaction(async (connection) => {
        const role = await authModel.findRoleByName('ADHERENT', connection);
        const compte = await authModel.create({email, password_hash, id_role: role.id_role}, connection);
        const id_utilisateur = await utilisateurModel.create({...data, id_compte: compte.id}, connection);
        const id_adherent = await adherentModel.create({...data, id_utilisateur}, connection);

        return {id_compte: compte.id, email, role: 'ADHERENT', id_utilisateur, id_adherent};
    });

    return {success: true, data: result};
}

/// Créer un compte (login) pour une personne qui existe déjà en base
/// personne : l'adhérent ou le coach trouvé (contient id_utilisateur et id_compte)
async function createAccountFor(personne, nomRole, {email, password}){
    if (!personne) {
        return {success: false, error: 'INTROUVABLE'};
    }

    ///Un utilisateur n'a qu'un seul compte
    if (personne.id_compte) {
        return {success: false, error: 'COMPTE_EXISTANT'};
    }

    email = normalizeEmail(email);

    ///Vérifier si le mail existe déjà dans la base
    const existingUser = await authModel.findByEmail(email);
    if (existingUser) {
        return {success: false, error: 'EMAIL_UTILISE'};
    }

    ///créer l'empreinte du mot de passe avant de l'enregistrer dans la base
    const password_hash = await bcrypt.hash(password, 10);

    const result = await withTransaction(async (connection) => {
        const role = await authModel.findRoleByName(nomRole, connection);
        const compte = await authModel.create({email, password_hash, id_role: role.id_role}, connection);
        ///Relier le compte à l'utilisateur
        await utilisateurModel.updateCompte(personne.id_utilisateur, compte.id, connection);

        return {id_compte: compte.id, email, role: nomRole, id_utilisateur: personne.id_utilisateur};
    });

    return {success: true, data: result};
}

///Créer un compte pour un adhérent existant (rôle ADHERENT)
async function createAccountAdherent(id_adherent, data){
    const adherent = await adherentModel.findById(id_adherent);
    return createAccountFor(adherent, 'ADHERENT', data);
}

///Créer un compte pour un coach existant (rôle COACH)
async function createAccountCoach(id_coach, data){
    const coach = await coachModel.findById(id_coach);
    return createAccountFor(coach, 'COACH', data);
}

async function updatePassword(email, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    return authModel.updatePassword(email, password_hash);
}

async function findByEmail(email) {
    return authModel.findByEmail(email);
}

async function verifyPassword(email, password) {
    const user = await authModel.findByEmail(email);
    if (!user) {
        throw new Error('Email non trouvé');
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Mot de passe incorrect');
    }
    return user;
}

/// Connexion : un seul login pour tous les rôles
/// 1. trouver le compte par email (avec son rôle grâce au JOIN)
/// 2. comparer le mot de passe avec le hash
/// 3. créer un token qui contient id_compte + rôle
async function login(email, motDePasse) {
    const compte = await authModel.findByEmail(normalizeEmail(email));

    if (!compte) {
        return { success: false, error: 'EMAIL_INVALIDE' };
    }

    const valide = await bcrypt.compare(motDePasse, compte.password_hash);

    if (!valide) {
        return { success: false, error: 'MOT_DE_PASSE_INVALIDE' };
    }

    /// Le rôle vient de la BDD (via le JOIN dans findByEmail), pas du body
    const token = tokenService.createAccessToken(compte, compte.role);
    return {success: true, data: token};
}

module.exports = {
    register,
    updatePassword,
    findByEmail,
    verifyPassword,
    createAccountAdherent,
    createAccountCoach,
    login
};
