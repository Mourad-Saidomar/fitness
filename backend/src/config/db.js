// const mysql = require('mysql2');

// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// module.exports = db;

// db.connect((err) => {
//   if (err) {
//     console.error('Erreur de connexion à MariaDB :', err);
//     return;
//   }
//   console.log('Connexion à MariaDB réussie !');
// });

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit : 5  
}).promise();

(async()=>{
    try{
        await pool.query('SELECT 1');
        console.log(' Connexion à MariaDB réussie');
    }
    
    catch(err){
        console.log('Erreur de connexion à MariaDB', err.message);
    }
})();

module.exports = pool;