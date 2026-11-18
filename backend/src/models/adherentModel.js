const pool = require('../config/db.js');

/// Les infos personnelles (nom, prénom...) sont dans utilisateur
/// → on fait un JOIN pour renvoyer un adhérent "complet"
const SELECT_ADHERENT = `
    SELECT a.id_adherent, a.id_utilisateur,
           u.nom, u.prenom, u.date_naissance, u.adresse, u.telephone, u.sexe, u.id_compte,
           a.date_creation, a.poids, a.imc, a.contrat,
           a.id_abonnement, ab.nom AS abonnement
    FROM adherent a
    JOIN utilisateur u ON u.id_utilisateur = a.id_utilisateur
    LEFT JOIN abonnement ab ON ab.id_abonnement = a.id_abonnement`;

async function findAll(){
    const [rows] = await pool.query(SELECT_ADHERENT);

    return rows;
}

async function findById(id, db = pool){
    const [rows] = await db.query(`
        ${SELECT_ADHERENT}
        WHERE a.id_adherent = ?`,
        [id]);

    return rows[0] ?? null;
}

/// Trouver un adhérent par son id_compte (pour la route /me)
/// compte → utilisateur → adherent
async function findByCompteId(id_compte){
    const [rows] = await pool.query(`
        ${SELECT_ADHERENT}
        WHERE u.id_compte = ?`,
        [id_compte]);

    return rows[0] ?? null;
}

async function create({id_utilisateur, id_abonnement, poids, imc, contrat}, db = pool){
    const [result] = await db.query(`
        INSERT INTO adherent (id_utilisateur, id_abonnement, poids, imc, contrat)
        VALUES (?, ?, ?, ?, ?)`,
        [id_utilisateur, id_abonnement ?? null, poids ?? null, imc ?? null, contrat ?? null]);

    return Number(result.insertId);
}

/// COALESCE : si un champ n'est pas envoyé (NULL), on garde l'ancienne valeur
async function update(id_adherent, {id_abonnement, poids, imc, contrat}, db = pool){
    const [result] = await db.query(`
        UPDATE adherent
        SET id_abonnement = COALESCE(?, id_abonnement),
            poids = COALESCE(?, poids),
            imc = COALESCE(?, imc),
            contrat = COALESCE(?, contrat)
        WHERE id_adherent = ?`,
        [id_abonnement ?? null, poids ?? null, imc ?? null, contrat ?? null, id_adherent]);

    return result.affectedRows;
}

module.exports = {
    findAll,
    findById,
    findByCompteId,
    create,
    update
}
