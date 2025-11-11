import express from 'express';
import MainController from '../controllers/main.controller.js';

const mainRouters = express.Router();

mainRouters.post('/addTelemetryData', MainController.addTelemetryData);

export { mainRouters };
