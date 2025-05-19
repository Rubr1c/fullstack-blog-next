import winston, { Logform } from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const consoleLogFormat = printf(
  ({ level, message, timestamp: ts, stack }: Logform.TransformableInfo) => {
    return `${ts} ${level}: ${stack || message}`;
  }
);

const transports: winston.transport[] = [];

const nodeEnv = process.env.NODE_ENV || 'development';
const logLevel =
  process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug');

if (nodeEnv === 'test') {
  transports.push(new winston.transports.Console({ silent: true }));
} else if (nodeEnv === 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(
        timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleLogFormat
      ),
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: transports,
  exitOnError: false,
});

if (nodeEnv === 'test') {
  logger.transports.forEach((t: winston.transport) => {
    t.silent = true;
  });
}

export default logger;
