const pool = require('./db.js');

/// Exécuter plusieurs requêtes en "tout ou rien"
/// Exemple : créer un compte + un utilisateur + un adhérent
/// Si une requête échoue, toutes les précédentes sont annulées (rollback)
async function withTransaction(callback){
    const connection = await pool.getConnection();
    try{
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    }
    catch(err){
        await connection.rollback();
        throw err;
    }
    finally{
        connection.release();
    }
}

module.exports = withTransaction;
