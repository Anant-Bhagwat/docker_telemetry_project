import Sequelize from 'sequelize';
import dbConfig from './jsonReader.js';

const sequelize = new Sequelize(
  dbConfig.db.db_name,
  dbConfig.db.user,
  dbConfig.db.password,
  {
    host: dbConfig.db.host,
    dialect: dbConfig.db.dialect,
    timezone: 'Asia/Kolkata',
    dialectOptions: { timezone: 'Asia/Kolkata', },
  }
);

const checkDatabaseConnection = async (sequelizeInstance, dbName) => {
  try {
    await sequelizeInstance.authenticate();
    console.log(`Connection to ${dbName} has been established successfully.`);
    await sequelizeInstance.sync({ force: false });
    console.log(`Models synced with ${dbName}`);
  } catch (error) {
    console.error(`Unable to connect to ${dbName}:`, error);
  }
};

// Check both database connections
checkDatabaseConnection(sequelize, dbConfig.db.db_name);
/*
// checkDatabaseConnection(registrySequelize, 'Registry DB');
*/

export { sequelize };

