const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
const IORedis = require("ioredis");

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASS,
  },
});

// Correct Redis connection settings for BullMQ
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // ✅ Required for BullMQ
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    try {
      console.log("Processing email job:", job.data);
      await transporter.sendMail(job.data); // Send email
      console.log(`Email sent for job ${job.id}`);
    } catch (error) {
      console.error(`Error sending email for job ${job.id}:`, error);
      throw error; // BullMQ will retry the job
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});

module.exports = worker;
