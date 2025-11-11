import app from './app.js';
import dotenv from 'dotenv';
import 'express-async-errors';
import dbConfig from './config/jsonReader.js';

dotenv.config();
const port = dbConfig.server_port
console.log('port',port);

const start = async () => {
	try {

		const requiredEnv = ['PORT'];

		for (const envdata of requiredEnv) {
			if (!process.env[envdata]) {
				throw new Error(`${envdata} must be defined.`);
			}
		}

		app.listen(port, () => {
			console.log('Agristack Telemetry Project is running on port: ', port);
		});

	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};
start();