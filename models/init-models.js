import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _api_logs from  "./api_logs.js";
import _api_logs_new from  "./api_logs_new.js";

export default function initModels(sequelize) {
  const api_logs = _api_logs.init(sequelize, DataTypes);
  const api_logs_new = _api_logs_new.init(sequelize, DataTypes);


  return {
    api_logs,
    api_logs_new,
  };
}
