const logger = require("../logger");
 
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
//   console.log("🟡 Middleware Hit:", req.method, req.originalUrl);
  logger.info(`➡️  Incoming Request: ${req.method} ${req.originalUrl}`, { timestamp: new Date().toISOString() });
  logger.debug(`Headers: ${JSON.stringify(req.headers)}`, { timestamp: new Date().toISOString() });
 
  // Handle body logging safely
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Body: ${JSON.stringify(req.body)}`, { timestamp: new Date().toISOString() });
  } else {
    logger.debug("Body: undefined", { timestamp: new Date().toISOString() });
  }
 
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const message = `${req.method} ${req.originalUrl} ${status} - ${duration}ms`;
  
    if (status >= 500) {
      logger.error(`❌ ${message}`);
    } else if (status >= 400) {
      logger.warn(`⚠️  ${message}`);
    } else {
      logger.info(`✅ ${message}`);
    }
  
    logger.debug(`Response Headers: ${JSON.stringify(res.getHeaders())}`);
  });
 
  next(); // ✅ VERY IMPORTANT
};
 
module.exports = requestLogger;