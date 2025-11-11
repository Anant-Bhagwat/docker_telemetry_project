import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { mainRouters } from './routes/main.route.js';
import correlator from 'express-correlation-id';
import { sequelize } from './config/db.js';
import initModels from './models/init-models.js';
import cron from 'node-cron';
const models = initModels(sequelize);
import { sendTelemetryDataTOCentral } from './services/main.service.js'
import dbConfig from './config/jsonReader.js';
const app = express();
app.disable("x-powered-by");
console.log('-----------------config----------------',dbConfig);


app.use(express.json());

const corsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE'],     // ✅ Restrict allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key'], // ✅ Restrict headers
  credentials: true                               // Optional: only if cookies/auth needed
};

app.use(cors(corsOptions));

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(correlator())

app.get('/', async (req, res) => {
  return res.status(200).json({ message: 'Welcome to Telemetry' });
});


app.use('/main', mainRouters);
const schedule = dbConfig.schedule || [ '0 5 * * * *' ]
// const schedule = [ '44 19 * * *' ]

schedule.forEach((cronTime) => {
  cron.schedule(cronTime, async () => {
    console.log(`Cron job started at ${new Date().toISOString()} for schedule: ${cronTime}`);

    const date = new Date().toISOString().slice(0, 10); // Today's date in YYYY-MM-DD

    const success = await sendTelemetryDataTOCentral(date);

    if (success) {
      console.log('✅ Telemetry data sent successfully.');
    } else {
      console.log('❌ Failed to send telemetry data.');
    }
  });
});

export default app;