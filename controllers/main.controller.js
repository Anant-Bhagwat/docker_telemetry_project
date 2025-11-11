import { mainService } from '../services/index.js';
import 'express-async-errors';

class MainController {
    static async addTelemetryData(req, res, next) {
        try {
             await mainService.addTelemetryData(req, res, next);
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    }
}

export default MainController;
