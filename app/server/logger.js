const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, simple } = format;
 
// Format for all logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});
 
// Filter to exclude error logs
const excludeErrors = format((info) => {
  return info.level === 'error' ? false : info;
});
 
const logger = createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    errors({ stack: true })
  ),
  transports: [
    // Error log: only 'error' level
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(logFormat)
    }),
    // Combined log: exclude 'error' level
    new transports.File({
      filename: 'logs/combined.log',
      format: combine(
        excludeErrors(),
        logFormat
      )
    })
  ]
});
 
// Console logging
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.Console({
    format: simple()
  }));
}
 
module.exports = logger;