import fs from 'fs';
import path from 'path';
const dbConfigPath = 'D:\\config.json';

let dbConfig = {};
// try {
//   const data = fs.readFileSync(dbConfigPath, 'utf8');
//   dbConfig = JSON.parse(data);
// } catch (err) {
//   console.error('Error reading DB config:', err);
// }

const configPath = path.join('/app/config', 'config.json');
dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export default dbConfig;
