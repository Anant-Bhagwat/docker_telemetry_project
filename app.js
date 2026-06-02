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
const schedule = Array.isArray(dbConfig.schedule) && dbConfig.schedule.length > 0
  ? dbConfig.schedule
  : [ '0 */3 * * * *' ];

let isSchedulerRunning = false;

schedule.forEach((cronTime) => {
  if (!cron.validate(cronTime)) {
    console.error(`Invalid cron schedule: ${cronTime}`);
    return;
  }

  cron.schedule(cronTime, async () => {
    if (isSchedulerRunning) {
      console.log(`Skipping cron run at ${new Date().toISOString()} for schedule: ${cronTime} because another run is still in progress.`);
      return;
    }

    isSchedulerRunning = true;
    console.log(`Cron job started at ${new Date().toISOString()} for schedule: ${cronTime}`);

    try {
      const date = new Date().toISOString().slice(0, 10); // Today's date in YYYY-MM-DD
      const success = await sendTelemetryDataTOCentral(date);

      if (success) {
        console.log('✅ Cron job run successfully.');
      } else {
        console.log('❌ Cron job failed.');
      }
    } catch (error) {
      console.error('❌ Cron job error:', error);
    } finally {
      isSchedulerRunning = false;
    }
  });
});

export default app;