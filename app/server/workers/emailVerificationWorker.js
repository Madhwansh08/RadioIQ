const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const nodemailer = require("nodemailer");

// ✅ Redis Connection
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// ✅ Nodemailer Transporter (Email Configuration)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASS,
  },
});

// ✅ Email Worker to process jobs
const worker = new Worker(
  "emailVerificationQueue",
  async (job) => {
    try {
      console.log("📩 Sending verification email:", job.data.email);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: job.data.email,
        subject: "RadioIQ - Verify Your Email",
        html: `<p>Click the link below to verify your email. This link expires in 10 minutes:</p>
               <a href="${job.data.verificationLink}">${job.data.verificationLink}</a>`,
      });
      console.log("✅ Email sent successfully to", job.data.email);
    } catch (error) {
      console.error("❌ Error sending verification email:", error);
      throw error; // This will allow BullMQ to retry the job
    }
  },
  { connection }
);

// ✅ Log success and failure
worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
worker.on("failed", (job, err) =>
  console.error(`❌ Job ${job.id} failed:`, err)
);

module.exports = worker;
