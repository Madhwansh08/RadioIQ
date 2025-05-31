const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// ✅ Create Redis connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// ✅ Create a queue for email verification tasks
const emailVerificationQueue = new Queue("emailVerificationQueue", { connection });

module.exports = emailVerificationQueue;
