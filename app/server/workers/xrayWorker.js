// src/workers/xrayWorker.js
const { Worker } = require("bullmq");
const { connection } = require("../queues/xrayQueue"); // use the shared connection

// Import the processing function from the controller.
const {processDicomFile} = require("../utils/processFile");



// In-memory map to store client-specific workers.
const clientWorkers = {};

/**
 * Returns an existing Worker for the given clientId or creates a new one.
 * Each worker listens to the queue named "xrayQueue_<clientId>".
 */
function getWorkerForClient(clientId) {
  if (!clientWorkers[clientId]) {
    clientWorkers[clientId] = new Worker(
      `xrayQueue_${clientId}`, // Add backticks for template literal
      async (job) => {
        const { file, doctorId, clientId, index, totalFiles } = job.data;
        console.log(job.data);
        console.log(`🔄 Processing X-ray job for client ${clientId} - File: ${job.data.file} (${index + 1}/${totalFiles})`);
        return await processDicomFile(job.data.file, job.data.doctorId, job.data.clientId, job.data.index, job.data.totalFiles);
      },
      {
        concurrency: 5,
        connection,
      }
    );

    clientWorkers[clientId].on("completed", (job, result) => {
      console.log(`✅ Client ${clientId} - X-ray job ${job.id} completed successfully`);
    });

    clientWorkers[clientId].on("failed", (job, err) => {
      console.error(`❌ Client ${clientId} - X-ray job ${job.id} failed:`, err);
    });
  }
  return clientWorkers[clientId];
}

module.exports = { getWorkerForClient };
