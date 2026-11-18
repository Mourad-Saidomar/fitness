const pool = require('../config/db');

async function getParticipationAdherent(id_adherent, id_seance){
    const [rows] = await pool.query(`
        select * from participation
        where id_adherent = ? and id_seance = ?`,
        [id_adherent, id_seance]);

    return rows[0] ?? null;
}

async function deleteSeanceAdherent(id){
    const [result] = await pool.query(`
        delete from participation
        where id_adherent = ?`,
        [id]);
    
    return result.affectedRows;
}

///vérifier si l'adherent s'est déjà inscrit à la sééance
async function getAdherentSeance(id_adherent, id_seance){
    const [rows] = await pool.query(`
        select * from adherent a
        inner join participation p on p.id_adherent = a.id_adherent
        where p.id_seance = ? and a.id_adherent = ?`,
        [id_seance, id_adherent]);
    return rows[0] ?? null;
}

//inscrire un adherent à une séance
async function inscrireAdherent({id_seance, id_adherent, present}){
    const [result] = await pool.query(`
        INSERT INTO participation
        (id_seance, id_adherent, present)
        VALUES(?, ?, ?)`,
        [id_seance, id_adherent, present]);

    return {
        id_adherent,
        id_seance,
        present
    };
}

//annuler inscription
async function annulerInscription(id_adherent, id_seance){
    const [result] = await pool.query(`
         delete from participation
        where id_adherent = ? and id_seance = ?`,
        [id_adherent, id_seance]);
    
    return result.affectedRows;
}

//mettre à jour la présence
async function enregistrerPresence(id_adherent, id_seance){
    const [result] = await pool.query(`
        update participation
        set present = 1
        where id_adherent = ? and id_seance = ?`,
        [id_adherent, id_seance]);
    
    return result.affectedRows;
}

module.exports = {
    deleteSeanceAdherent,
    getAdherentSeance,
    inscrireAdherent,
    getParticipationAdherent,
    annulerInscription,
    enregistrerPresence
}