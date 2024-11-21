import { createLogger, format, transports } from 'winston';

// Create a browser-compatible logger
const createBrowserLogger = () => ({
  debug: (message: string) => console.debug(message),
  info: (message: string) => console.info(message),
  warn: (message: string) => console.warn(message),
  error: (message: string) => console.error(message),
});

// Create a server-side logger
const createServerLogger = () => {
  const transportsArray = [
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  ];

  transportsArray.push(
    new transports.File({
      filename: 'logs/app.log',
      level: 'info',
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );

  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: transportsArray,
  });
};

// Export the appropriate logger based on the environment
export const logger = typeof window === 'undefined' ? createServerLogger() : createBrowserLogger();