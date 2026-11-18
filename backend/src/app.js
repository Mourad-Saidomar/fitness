const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const cors = require('cors');
const express = require('express');
const db = require('./config/db.js');
const requestLogger = require('./middlewares/requestLogger.js');
const notFound = require('./middlewares/notFound.js');
const errorHandler = require('./middlewares/errorHandler.js');
const adherentRoutes = require('./routes/adherent.routes.js');
const coachRoutes = require('./routes/coach.routes.js');
const abonnementRoutes = require('./routes/abonnement.routes.js');
const seanceRoutes = require('./routes/seance.routes.js');
const participationRoutes = require('./routes/participation.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.IP || process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Serveur lancé sur ${HOST}:${PORT}`);
});

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/', (req, res) => {
  res.send('Hello World!');
});



app.use('/adherents', adherentRoutes);
app.use('/coachs', coachRoutes);
app.use('/abonnements', abonnementRoutes);
app.use('/seances', seanceRoutes);
app.use('/participations', participationRoutes);
app.use('/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);
