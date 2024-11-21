import { createLogger, format, transports } from 'winston';

const transportsArray = [
  new transports.Console({
    level: 'debug', // Log debug and above to the console
    format: format.combine(
      format.colorize(), // Add colors to the console output
      format.simple()
    ),
  })
];

// Only add file transports when running on the server side
if (typeof window === 'undefined') {
  transportsArray.push(
    new transports.File({
      filename: 'logs/app.log',
      level: 'info', // Log info and above to the file
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error', // Log errors to a separate file
    })
  );
}

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: transportsArray,
});