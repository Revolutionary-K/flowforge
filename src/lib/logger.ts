const isDev = process.env.NODE_ENV === 'development';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = isDev ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return data ? `${prefix} ${message}` : `${prefix} ${message}`;
}

export const logger = {
  debug(message: string, data?: unknown) {
    if (!shouldLog('debug')) return;
    if (data !== undefined) {
      console.debug(formatMessage('debug', message), data);
    } else {
      console.debug(formatMessage('debug', message));
    }
  },

  info(message: string, data?: unknown) {
    if (!shouldLog('info')) return;
    if (data !== undefined) {
      console.info(formatMessage('info', message), data);
    } else {
      console.info(formatMessage('info', message));
    }
  },

  warn(message: string, data?: unknown) {
    if (!shouldLog('warn')) return;
    if (data !== undefined) {
      console.warn(formatMessage('warn', message), data);
    } else {
      console.warn(formatMessage('warn', message));
    }
  },

  error(message: string, error?: unknown) {
    if (!shouldLog('error')) return;
    if (error !== undefined) {
      console.error(formatMessage('error', message), error);
    } else {
      console.error(formatMessage('error', message));
    }
  },
};
