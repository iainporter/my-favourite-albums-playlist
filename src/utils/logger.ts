import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

// Create a timestamp formatter
const timestampFormatter = () => {
  return new Date().toISOString();
};

// Create a browser-compatible logger with formatted output
const createBrowserLogger = () => ({
  debug: (message: string, ...args: any[]) => {
    const timestamp = timestampFormatter();
    console.debug(`${timestamp} [DEBUG]:`, message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    const timestamp = timestampFormatter();
    console.info(`${timestamp} [INFO]:`, message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    const timestamp = timestampFormatter();
    console.warn(`${timestamp} [WARN]:`, message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    const timestamp = timestampFormatter();
    console.error(`${timestamp} [ERROR]:`, message, ...args);
  },
});

// Create a server-side logger with file rotation
const createServerLogger = () => {
  const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  );

  const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, stack }) => {
      if (stack) {
        return `${timestamp} [${level}]: ${message}\n${stack}`;
      }
      return `${timestamp} [${level}]: ${message}`;
    })
  );

  const transportsArray = [
    new transports.Console({
      format: consoleFormat,
      level: 'debug',
    }),
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: logFormat,
    }),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: logFormat,
    })
  ];

  return createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: logFormat,
    transports: transportsArray,
    exitOnError: false,
  });
};

// Export the appropriate logger based on the environment
export const logger = typeof window === 'undefined' ? createServerLogger() : createBrowserLogger();