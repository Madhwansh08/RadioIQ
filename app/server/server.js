// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const cookieParser = require("cookie-parser");
const { addClient, removeClient } = require("./sse");
const playgroundRoutes = require("./Routes/playgroundRoutes");
const logger = require("./logger");
const requestLogger = require("./middleware/loggerMiddleware");

// DB & Redis
const connectDB = require("./config/db");
const redisClient = require("./config/redis");

// UUID - utils
const { v4: uuidv4 } = require("uuid");

// Swagger
const swaggerUI = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
const endPoint = require("./endPoints");

// Import Routes
const authRoutes = require("./Routes/authRoutes");
const xrayRoutes = require("./Routes/xrayRoutes");
const patientRoutes = require("./Routes/patientRoutes");
const contactRoutes = require("./Routes/contactRoutes");
const reportRoutes = require("./Routes/reportRoutes");

// App Initialization
const app = express();
app.set("trust proxy", 1); // Trust first proxy (Nginx)
const PORT = process.env.PORT || 7000;

// Health Check Endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



app.use(requestLogger); // Custom request logger middleware
// app.use(cors(corsOptions));
app.use(express.json({ limit: "500mb" }));
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

// Database Connection
connectDB()
  .then(() => {
    logger.info("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    logger.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Crash app if DB not connected
  });

// SSE Connection
const clients = {};

app.options("*", (req, res) => {
  // res.setHeader("Access-Control-Allow-Origin", allowedOrigins);
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// SSE (Server-Sent Events) Route
app.get(endPoint.eventStream, (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  // res.setHeader("Access-Control-Allow-Origin", allowedOrigins);

  // Generate a unique client ID
  const clientId = uuidv4();
  addClient(clientId, res);
  logger.info(`New SSE client connected: ${clientId}.`);

  // Keep the connection alive > Send a comment every 15 seconds to keep the connection open
  // This is optional and can be removed if not needed
  const keepAlive = setInterval(() => {
    res.write(":\n\n"); // comment to keep the stream open
  }, 15000);
  
  // Send the clientId to the frontend
  res.write(`data: ${JSON.stringify({ clientId })}\n\n`);

  // Remove client on disconnect
  req.on("close", () => {
    clearInterval(keepAlive);
    console.log(`SSE connection closed for client: ${clientId}`);
    removeClient(clientId);
  });
});

// Function to Send Events to Connected Clients
const sendEvent = (clientId, event) => {
  if (!clientId || typeof clientId !== "string") {
    logger.warn(`Invalid clientId received in sendEvent: ${clientId}`);
    return;
  }
  if (clients[clientId]) {
    clients[clientId].write(`data: ${JSON.stringify(event)}\n\n`);
  } else {
    logger.warn(`No active SSE connection found for clientId: ${clientId}`);
  }
};
app.set("sendEvent", sendEvent);

app.use(helmet());
app.use(compression());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // 100 requests per window
});
app.use(limiter);

// Routes
app.use(endPoint.useXrayRoutes, xrayRoutes);
app.use(endPoint.usePatientRoutes, patientRoutes);
app.use(endPoint.useAuthRoutes, authRoutes);
app.use(endPoint.useContactRoutes, contactRoutes);
app.use(endPoint.useReportRoutes, reportRoutes);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.use("/playground", playgroundRoutes);

// Redis Test Route
app.get("/redis-test", async (req, res) => {
  try {
    await redisClient.set("test-key", "radiovision-health", { EX: 10 });
    const value = await redisClient.get("test-key");
    res.json({
      status: "success",
      data: value,
      message: "Redis connection working!",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Redis connection failed: " + error.message,
    });
  }
});

app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  logger.error(err.stack || err.message || err);
  res.status(500).json({
    status: "error",
    message: isProd ? "Internal Server Error" : (err.message || "Error"),
  });
});



// Start Express Server
const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Swagger Docs available at: ${process.env.API_DOCS_URL}`);
});

// Graceful Shutdown Handling
const shutdown = async () => {
  logger.info("Shutting down server...");

  // Close Redis Connection
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info("Redis disconnected successfully.");
    } catch (err) {
      logger.error("Error closing Redis:", err);
    }
  }

  // Close Express Server
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  shutdown();
});

// Start Workers
require("./workers/emailWorker");
require("./workers/emailVerificationWorker");
require("./workers/xrayWorker");
