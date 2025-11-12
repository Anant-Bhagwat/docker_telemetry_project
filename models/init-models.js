import _sequelize from "sequelize";
const DataTypes = _sequelize.DataTypes;
import _api_logs from  "./api_logs.js";

export default function initModels(sequelize) {
  const api_logs = _api_logs.init(sequelize, DataTypes);


  return {
    api_logs,
  };
}
