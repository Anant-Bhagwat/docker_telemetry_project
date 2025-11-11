import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class api_logs extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    log_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    unique_id: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4
    },
    aiu_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    aip_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    trans_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    correlation_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    request_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    api_name: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mapper_id: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    method: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    response_status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response_status_code: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    response_type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    api_latency: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    response_time_ms: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    receipt_reference_data_validity: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    receipt_reference_token_valid: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    consent_required: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    consent_artifact_timestamp: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receipt_reference_timestamp: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    added_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    is_shared: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'api_logs',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "api_logs_pkey",
        unique: true,
        fields: [
          { name: "log_id" },
        ]
      },
      {
        name: "idx_api_logs_added_date",
        fields: [
          { name: "added_date" },
        ]
      },
    ]
  });
  }
}
