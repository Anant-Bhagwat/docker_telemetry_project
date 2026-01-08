import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dockerConfigPath = '/app/config.json';
// const dockerConfigPath = './config.json';
const localConfigPath = path.join(__dirname, 'config.json');
let dbConfig;
try {
  const configPath = fs.existsSync(dockerConfigPath)
    ? dockerConfigPath
    : localConfigPath;

  const rawData = fs.readFileSync(configPath, 'utf8');
  dbConfig = JSON.parse(rawData);
  console.log(`Config loaded from: ${configPath}`);
} catch (err) {
  console.error('❌ Failed to load config.json:', err);
  process.exit(1); // Fail fast (recommended)
}

export default dbConfig;
