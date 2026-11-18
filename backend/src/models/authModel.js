const pool = require('../config/db.js');

/// Trouver un compte par email, avec le nom de son rôle (JOIN role)
async function findByEmail(email, db = pool){
    const [rows] = await db.query(`
        SELECT c.*, r.nom AS role
        FROM compte c
        JOIN role r ON c.id_role = r.id_role
        WHERE c.email = ?`,
        [email]);

    return rows[0] ?? null;
}

async function create({email, password_hash, id_role}, db = pool){
    const [result] = await db.query(`
        INSERT INTO compte (email, password_hash, id_role)
        VALUES (?, ?, ?)`,
        [email, password_hash, id_role]);

    return {
        id: Number(result.insertId),
        email,
        id_role
    };
}

async function updatePassword(email, password_hash) {
    const [result] = await pool.query(`
        UPDATE compte
        SET password_hash = ?
        WHERE email = ?`,
        [password_hash, email]);

    return result.affectedRows;
}

async function remove(id_compte, db = pool){
    const [result] = await db.query(`
        DELETE FROM compte
        WHERE id_compte = ?`,
        [id_compte]);

    return result.affectedRows;
}

/// Récupérer l'id_role à partir du nom du rôle
async function findRoleByName(nom, db = pool){
    const [rows] = await db.query(`
        SELECT id_role FROM role WHERE nom = ?`,
        [nom]);

    return rows[0] ?? null;
}

module.exports = {
    create,
    updatePassword,
    findByEmail,
    remove,
    findRoleByName
}
