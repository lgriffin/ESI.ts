import { createLogger, format, transports } from 'winston';
import { Loggly } from 'winston-loggly-bulk';

const { combine, timestamp, printf, colorize } = format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create Winston logger instance
const logger = createLogger({
  format: combine(
    colorize(), // Enable colors for log levels
    timestamp(), // Add timestamp to logs
    logFormat // Apply custom format
  ),
  transports: [
    new transports.Console(), // Log to console
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors to a file
    new transports.File({ filename: 'logs/combined.log' }) // Log all levels to a file
  ]
});

// Optional: Add Loggly transport for remote logging
if (process.env.NODE_ENV === 'production') {
  logger.add(new Loggly({
    token: 'YOUR_LOGGLY_TOKEN',
    subdomain: 'YOUR_LOGGLY_SUBDOMAIN',
    tags: ['Winston-NodeJS'],
    json: true
  }));
}

export default logger;
