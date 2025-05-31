// src/queues/xrayQueue.js
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required for BullMQ
});

/**
 * Returns a new Queue instance for the specified client.
 */
function getQueueForClient(clientId) {
  return new Queue(`xrayQueue_${clientId}`, { connection });
}

module.exports = { getQueueForClient, connection };
