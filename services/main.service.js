import { Op, fn, col, where } from 'sequelize';
import Api_logs from '../models/api_logs.js';
// import Api_logs_new from '../models/api_logs_new.js';
import axios from 'axios';
import dbConfig from '../config/jsonReader.js';
import { validate as isUUID } from 'uuid';
const client_participant_id = dbConfig.entity_id;
const addTelemetryData = async (req, res) => {
    try {
        console.log('-------------- aipTelemetryApi call --------------------------------');
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ status: 'NACK', message: 'Invalid or missing request body' });
        }
        const data = req.body;
        const requiredFields = [
            'server_participant_id',
            'telemetry_id',
            'api_endpoint',
            'request_timestamp',
            'response_timestamp',
            'response_status_code',
            'response_status',
            'response_type'
        ];
        const missingFields = requiredFields.filter(
            field => data[field] === undefined || data[field] === null || data[field] === ''
        );

        if (missingFields.length) {
            return res.status(400).json({
                status: 'NACK',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        if (!isUUID(data.server_participant_id)) {
            return res.status(400).json({ status: 'NACK', message: 'Invalid server_participant_id. Must be a valid UUID' });
        }
        if (!isUUID(data.telemetry_id)) {
            return res.status(400).json({ status: 'NACK', message: 'Invalid telemetry_id. Must be a valid UUID' });
        }
        const responseCode = Number(data.response_status_code);
        if (!Number.isInteger(responseCode)) {
            return res.status(400).json({ status: 'NACK', message: `Invalid response_status_code. Value must be a positive integer` });
        }
        if (!['success', 'failure'].includes(data.response_status)) {
            return res.status(400).json({ status: 'NACK', message: 'response_status must be success or failure' });
        }
        if (!['ACK', 'DATA', 'ERROR'].includes(data.response_type)) {
            return res.status(400).json({ status: 'NACK', message: 'response_type must be ACK, DATA, or ERROR' });
        }
        const isValidDateTime = (value) => {
            if (typeof value !== 'string') return false;
            const d = new Date(value);
            if (isNaN(d.getTime())) return false;
            return /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value);
        };
        const requestTime = isValidDateTime(data.request_timestamp) ? new Date(data.request_timestamp) : null;
        const responseTime = isValidDateTime(data.response_timestamp) ? new Date(data.response_timestamp) : null;
        if (!requestTime) {
            return res.status(400).json({ status: 'NACK', message: 'Invalid request_timestamp. Must include date and time' });
        }
        if (!responseTime) {
            return res.status(400).json({ status: 'NACK', message: 'Invalid response_timestamp. Must include date and time' });
        }

        if (data.response_status === 'failure' && (data.failure_reason === undefined || data.failure_reason === null || String(data.failure_reason).trim() === '')) {
            return res.status(400).json({ status: 'NACK', message: 'failure_reason is required when response_status is failure' });
        }
        await Api_logs.create({
            client_participant_id: client_participant_id ?? null,
            server_participant_id: data.server_participant_id,
            telemetry_id: data.telemetry_id,
            api_endpoint: data.api_endpoint,
            request_timestamp: requestTime,
            mapper_id: data.mapper_id ?? null,
            response_type: data.response_type,
            response_status: data.response_status,
            response_status_code: responseCode,
            failure_reason: data.failure_reason ?? null,
            response_timestamp: responseTime,
            data_size: data.data_size ?? null,
            output_validity: data.output_validity != null ? String(data.output_validity) : null,
            token_validity: data.token_validity != null ? String(data.token_validity) : null
        });

        return res.status(200).json({ status: 'ACK', message: 'Telemetry record stored successfully' });

    } catch (error) {
        console.error('Error in addTelemetryData:', error);
        return res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
    }
};


const structuredTelemetryData = async (date) => {
    const MAX_RETRIES = 3;

    try {
        // if (!date || date === '') {
        //     console.log('Date is missing');
        //     return false;
        // }

        const batchSize = 10000;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const dataBatch = await Api_logs.findAll({
                where: {
                    [Op.and]: [
                        // where(fn('DATE', col('added_date')), date),
                        { is_shared: false }
                    ]
                },
                order: [['log_id', 'ASC']],
                limit: batchSize,
                offset: offset
            });
            console.log('-----------dataBatch------------', dataBatch);

            if (dataBatch.length === 0) {
                hasMoreData = false;
                console.log('No more data to process.');
                break;
            }

            console.log(`Processing batch at offset ${offset}, size: ${dataBatch.length}`);

            // Map the batch to the format required by the destination API
            const formattedData = dataBatch.map(record => ({
                unique_id: record.unique_id,
                user_type: dbConfig.user_type,
                aiu_id: record.aiu_id,
                aip_id: record.aip_id,
                trans_id: record.trans_id,
                api_name: record.api_name,
                mapper_id: record.mapper_id || null,
                request_timestamp: record.request_timestamp,
                method: record.method,
                response_type: record.response_type,
                response_status: record.response_status,
                response_status_code: record.response_status_code,
                failure_reason: record.failure_reason ?? null,
                response_timestamp: record.response_timestamp,
                data_size: record.data_size,
                api_latency: record.api_latency,
                response_time_ms: record.response_time_ms,
                receipt_reference_data_validity: record.receipt_reference_data_validity,
                receipt_reference_token_valid: record.receipt_reference_token_valid,
                consent_required: record.consent_required,
                consent_artifact_timestamp: record.consent_artifact_timestamp,
                receipt_reference_timestamp: record.receipt_reference_timestamp,
                telemetry_added_date: record.added_date
            }));

            let success = false;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'x-api-key': dbConfig.api_key
                    };

                    const response = await axios.post(process.env.DESTINATION_API, formattedData, { headers });

                    console.log(`✅ Success on attempt ${attempt}, status: ${response.status}`);

                    if (response.status === 200) {
                        // const idsToUpdate = dataBatch.map(record => parseInt(record.log_id, 10));
                        const uniqueIds = response.data.data;
                        console.log('----------------response.data------------------------------------', response.data);
                        console.log('----------------uniqueIds------------------------------------', uniqueIds);

                        const [updatedCount] = await Api_logs.update(
                            { is_shared: true },
                            { where: { unique_id: { [Op.in]: uniqueIds } } }
                        );

                        console.log(`🔄 Records updated: ${updatedCount}`);
                        console.log(`✅ Batch at offset ${offset} marked as shared`);
                        success = true;
                        break; // Exit retry loop
                    } else {
                        console.warn(`⚠️ Unexpected status code: ${response.status}`);
                    }

                } catch (error) {
                    console.error(`❌ Attempt ${attempt} failed at offset ${offset}:`, error.response?.data || error.message);

                    // Optional: add delay before retry
                    if (attempt < MAX_RETRIES) {
                        await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
                        console.log(`🔁 Retrying (${attempt + 1}/${MAX_RETRIES})...`);
                    }
                }
            }

            if (!success) {
                console.error(`⛔ Failed to send batch after ${MAX_RETRIES} attempts at offset ${offset}. Moving on.`);
                // Optional: log these records somewhere or store for manual retry
            }

            offset = offset + batchSize;
        }

        return true;

    } catch (error) {
        console.error('❌ Error in sendTelemetryDataTOCentral:', error);
        return false;
    }
};

const sendTelemetryDataTOCentral = async (date) => {
    const MAX_RETRIES = 3;

    try {
        const batchSize = 200;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            const dataBatch = await Api_logs.findAll({
                where: {
                    [Op.and]: [
                        // where(fn('DATE', col('added_date')), date),
                        { is_shared: false }
                    ]
                },
                order: [['log_id', 'ASC']],
                limit: batchSize,
                offset: offset,
                row: true
            });
            // console.log('-----------dataBatch------------', dataBatch);

            if (dataBatch.length === 0) {
                hasMoreData = false;
                console.log('No more data to process.');
                break;
            }

            console.log(`Processing batch at offset ${offset}, size: ${dataBatch.length}`);

            // Map the batch to the format required by the destination API
            const formattedData = dataBatch.map(record => ({
                unique_id: record.unique_id,
                client_participant_id: record.client_participant_id,
                server_participant_id: record.server_participant_id,
                telemetry_id: record.telemetry_id,
                api_endpoint: record.api_endpoint,
                request_timestamp: record.request_timestamp,
                mapper_id: record.mapper_id || null,
                response_type: record.response_type,
                response_status: record.response_status,
                response_status_code: record.response_status_code,
                failure_reason: record.failure_reason ?? null,
                response_timestamp: record.response_timestamp,
                data_size: record.data_size,
                output_validity: record.output_validity,
                token_validity: record.token_validity,
                telemetry_added_date: record.added_date
            }));

            let success = false;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'x-api-key': dbConfig.api_key
                    };                    

                    const response = await axios.post(process.env.DESTINATION_API, formattedData, { headers });

                    console.log(`✅ Success on attempt ${attempt}, status: ${response.status}`);

                    if (response.status === 200 || response.status === '200') {
                        // const idsToUpdate = dataBatch.map(record => parseInt(record.log_id, 10));
                        const uniqueIds = response.data.data;
                        console.log('----------------response.data------------------------------------', response.data);
                        console.log('----------------uniqueIds------------------------------------', uniqueIds);

                        const [updatedCount] = await Api_logs.update(
                            { is_shared: true },
                            { where: { unique_id: { [Op.in]: uniqueIds } } }
                        );

                        console.log(`🔄 Records updated: ${updatedCount}`);
                        console.log(`✅ Batch at offset ${offset} marked as shared`);
                        success = true;
                        break; // Exit retry loop
                    } else {
                        console.warn(`⚠️ Unexpected status code: ${response.status}`);
                    }

                } catch (error) {
                    console.error(`❌ Attempt ${attempt} failed at offset ${offset}:`, error.response?.data || error.message);

                    // Optional: add delay before retry
                    if (attempt < MAX_RETRIES) {
                        await new Promise(res => setTimeout(res, 1000)); // wait 1s before retry
                        console.log(`🔁 Retrying (${attempt + 1}/${MAX_RETRIES})...`);
                    }
                }
            }

            if (!success) {
                console.error(`⛔ Failed to send batch after ${MAX_RETRIES} attempts at offset ${offset}. Moving on.`);
                // Optional: log these records somewhere or store for manual retry
            }

            offset = offset + batchSize;
        }

        return true;

    } catch (error) {
        console.error('❌ Error in sendTelemetryDataTOCentral:', error);
        return false;
    }
};

export {
    addTelemetryData,
    sendTelemetryDataTOCentral
};