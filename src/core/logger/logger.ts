import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create Winston logger instance — console only by default.
// Libraries should not write to files; the consuming application controls logging.
const logger = createLogger({
  level: process.env.ESI_LOG_LEVEL || 'warn',
  format: combine(
    colorize(),
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console()
  ]
});

export default logger;
