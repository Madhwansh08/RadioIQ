const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // ✅ Required for BullMQ
});

const emailQueue = new Queue("emailQueue", { connection });

module.exports = emailQueue;
