const pool = require('../config/db');

/// Les infos personnelles (nom, prénom...) sont dans utilisateur
/// → on fait un JOIN pour renvoyer un coach "complet"
const SELECT_COACH = `
    SELECT c.id_coach, c.id_utilisateur,
           u.nom, u.prenom, u.date_naissance, u.adresse, u.telephone, u.sexe, u.id_compte,
           c.specialite
    FROM coach c
    JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur`;

///Chercher un coach par son ID
async function findById(id, db = pool){
    const [rows] = await db.query(`
        ${SELECT_COACH}
        WHERE c.id_coach = ?`,
        [id]);

    return rows[0] ?? null;
}

///Chercher seance animée par un coach à la même date
async function findSeanceCoachByDate(id_coach, date_seance, heure_debut, heure_fin){
    const [rows] = await pool.query(`
        SELECT u.nom, u.prenom, s.date_seance, s.heure_debut, s.heure_fin
        FROM coach c
        JOIN utilisateur u ON u.id_utilisateur = c.id_utilisateur
        JOIN seance s ON s.id_coach = c.id_coach
        WHERE c.id_coach = ?
        AND s.date_seance = ?
        AND s.heure_debut BETWEEN ? AND ?`,
        [id_coach, date_seance, heure_debut, heure_fin]);

    return rows[0] ?? null;
}

async function getAll(){
    const [rows] = await pool.query(SELECT_COACH);

    return rows;
}

async function create({id_utilisateur, specialite}, db = pool){
    const [result] = await db.query(`
        INSERT INTO coach (id_utilisateur, specialite)
        VALUES (?, ?)`,
        [id_utilisateur, specialite ?? null]);

    return Number(result.insertId);
}

async function update(id_coach, {specialite}, db = pool){
    const [result] = await db.query(`
        UPDATE coach
        SET specialite = COALESCE(?, specialite)
        WHERE id_coach = ?`,
        [specialite ?? null, id_coach]);

    return result.affectedRows;
}

/// Trouver un coach par son id_compte (pour la route /me)
/// compte → utilisateur → coach
async function findByCompteId(id_compte){
    const [rows] = await pool.query(`
        ${SELECT_COACH}
        WHERE u.id_compte = ?`,
        [id_compte]);

    return rows[0] ?? null;
}

module.exports = {
    findById,
    findByCompteId,
    findSeanceCoachByDate,
    getAll,
    create,
    update
}
