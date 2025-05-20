// A simple logger example
// In a real app, you might use a library like Winston or Pino

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

function log(level: LogLevel, message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  // In a server environment, you might prefer console.error for errors
  // or integrate with a proper logging service.
  if (level === LogLevel.ERROR) {
    console.error(`[${timestamp}] [${level}] ${message}`, ...args);
  } else if (level === LogLevel.WARN) {
    console.warn(`[${timestamp}] [${level}] ${message}`, ...args);
  } else {
    console.log(`[${timestamp}] [${level}] ${message}`, ...args);
  }
}

export const logger = {
  error: (message: string, ...args: unknown[]) =>
    log(LogLevel.ERROR, message, ...args),
  warn: (message: string, ...args: unknown[]) =>
    log(LogLevel.WARN, message, ...args),
  info: (message: string, ...args: unknown[]) =>
    log(LogLevel.INFO, message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    log(LogLevel.DEBUG, message, ...args),
};
