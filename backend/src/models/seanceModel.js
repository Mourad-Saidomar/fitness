const pool = require('../config/db');

///Sélectionnner une séance par son id
async function findById(id){
    const [rows] = await pool.query(`
        select * from seance
        where id_seance = ?`,
        [id]);
    
    return rows[0] ?? null;
}

///récupérer toutes les séances
async function getAllSeances(){
    const [rows] = await pool.query(`
        select * from seance`);

    return rows;
}

///Créer une séance
async function createSeance({date_seance, heure_debut, heure_fin, capacite_max, id_coach, id_salle, places_restantes}){
    console.log('date_seance', [date_seance]);
    const [result] = await pool.query(`
        INSERT INTO seance (date_seance, heure_debut, heure_fin, capacite_max, id_coach, id_salle, places_restantes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [date_seance, heure_debut, heure_fin, capacite_max, id_coach, id_salle, places_restantes])

    return {
        id: Number(result.insertId),
        date_seance,
        heure_debut,
        heure_fin
    };
}

//mettre à jour le nombre de place disponible
async function updateNbPlaceDispo(id_seance, nb){
    const [result] = await pool.query(`
        update seance
        set places_restantes = ?
        where id_seance = ?`,
        [nb, id_seance]);
    
    return result.affectedRows;
}


///Récupérer le nombre de places disponibles
// async function getPlacesRestantes(id_seance){
//     const [rows] = await pool.query(`
//         select places_restantes from  seance
//         where  id_seance = ?`,
//         [id_seance]);
    
//     return rows[0] ?? null;
// }

module.exports = {
    createSeance,
    getAllSeances,
    findById,
    updateNbPlaceDispo
}

