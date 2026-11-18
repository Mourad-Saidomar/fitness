const pool = require('../config/db');

///Récupérer tous les abonnements
async function getAllAbonnement(){
    const [rows] = await pool.query('select * from abonnement');

    return rows;
}

///Chercher un abonnement par son nom
async function findAbonnementByName(nom){
    const [rows] = await pool.query(`
        select * from abonnement
        where nom = ?`,
        [nom]);

    return rows[0] ?? null;
}

///Crér un abonnement
async function createAbonnement({nom, duree_mois, tarif}){
    const [result] = await pool.query(`
        INSERT INTO abonnement (nom, duree_mois, tarif)
        VALUES (?, ?, ?)`,
    [nom, duree_mois, tarif])

    return {
        id: Number(result.insertId),
        nom,
        duree_mois,
        tarif
    };
}

module.exports = {
    findAbonnementByName,
    createAbonnement,
    getAllAbonnement
}