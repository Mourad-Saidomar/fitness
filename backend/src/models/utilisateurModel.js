const pool = require('../config/db.js');

/// Le paramètre db permet d'utiliser la connexion d'une transaction
/// (par défaut : le pool)

async function findById(id_utilisateur, db = pool){
    const [rows] = await db.query(`
        SELECT * FROM utilisateur
        WHERE id_utilisateur = ?`,
        [id_utilisateur]);

    return rows[0] ?? null;
}

async function create({nom, prenom, date_naissance, adresse, telephone, sexe, id_compte}, db = pool){
    const [result] = await db.query(`
        INSERT INTO utilisateur (nom, prenom, date_naissance, adresse, telephone, sexe, id_compte)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nom, prenom, date_naissance, adresse, telephone ?? null, sexe ?? null, id_compte ?? null]);

    return Number(result.insertId);
}

/// COALESCE : si un champ n'est pas envoyé (NULL), on garde l'ancienne valeur
async function update(id_utilisateur, {nom, prenom, date_naissance, adresse, telephone, sexe}, db = pool){
    const [result] = await db.query(`
        UPDATE utilisateur
        SET nom = COALESCE(?, nom),
            prenom = COALESCE(?, prenom),
            date_naissance = COALESCE(?, date_naissance),
            adresse = COALESCE(?, adresse),
            telephone = COALESCE(?, telephone),
            sexe = COALESCE(?, sexe)
        WHERE id_utilisateur = ?`,
        [nom ?? null, prenom ?? null, date_naissance ?? null, adresse ?? null,
         telephone ?? null, sexe ?? null, id_utilisateur]);

    return result.affectedRows;
}

/// Relier un compte (login) à un utilisateur
async function updateCompte(id_utilisateur, id_compte, db = pool){
    const [result] = await db.query(`
        UPDATE utilisateur
        SET id_compte = ?
        WHERE id_utilisateur = ?`,
        [id_compte, id_utilisateur]);

    return result.affectedRows;
}

/// Supprimer un utilisateur : ON DELETE CASCADE supprime aussi
/// l'adhérent ou le coach lié (et ses participations / séances)
async function remove(id_utilisateur, db = pool){
    const [result] = await db.query(`
        DELETE FROM utilisateur
        WHERE id_utilisateur = ?`,
        [id_utilisateur]);

    return result.affectedRows;
}

module.exports = {
    findById,
    create,
    update,
    updateCompte,
    remove
}
