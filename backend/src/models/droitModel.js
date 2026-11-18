const pool = require('../config/db.js');

/// Vérifier si un rôle possède un droit
/// Le rôle vient du token (ex : 'COACH'), le droit vient de la route (ex : 'creer_seance')
/// role ──< role_droit >── droit
async function roleHasDroit(nomRole, fonctionnalite){
    const [rows] = await pool.query(`
        SELECT d.id_droit
        FROM role r
        JOIN role_droit rd ON rd.id_role = r.id_role
        JOIN droit d ON d.id_droit = rd.id_droit
        WHERE r.nom = ? AND d.fonctionnalite = ?
        LIMIT 1`,
        [nomRole, fonctionnalite]);

    return rows.length > 0;
}

/// Lister tous les droits d'un rôle (utile pour afficher les permissions d'un utilisateur)
async function findByRole(nomRole){
    const [rows] = await pool.query(`
        SELECT d.fonctionnalite
        FROM role r
        JOIN role_droit rd ON rd.id_role = r.id_role
        JOIN droit d ON d.id_droit = rd.id_droit
        WHERE r.nom = ?`,
        [nomRole]);

    return rows.map(row => row.fonctionnalite);
}

module.exports = {
    roleHasDroit,
    findByRole
}
