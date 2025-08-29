// Tipos de log
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  [key: string]: any;
};

export type LogEntry = {
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
};

// Configuración de logging
const LOG_CONFIG = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  enableConsole: true,
  enableRemote: false, // Para futuras integraciones con servicios de logging
};

// Función para determinar si un nivel debe ser loggeado
function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(LOG_CONFIG.level as LogLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= configLevelIndex;
}

// Función para formatear el mensaje de log
function formatLogMessage(entry: LogEntry): string {
  const { level, message, context, error } = entry;
  const timestamp = new Date().toISOString();
  
  let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (context.component) {
    formatted += ` | Component: ${context.component}`;
  }
  
  if (context.action) {
    formatted += ` | Action: ${context.action}`;
  }
  
  if (error) {
    formatted += ` | Error: ${error.message}`;
  }
  
  return formatted;
}

// Función principal de logging
export function log(
  level: LogLevel,
  message: string,
  context: Partial<LogContext> = {},
  error?: Error
) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    context: {
      timestamp: new Date().toISOString(),
      ...context,
    },
    error,
  };

  const formattedMessage = formatLogMessage(entry);

  // Console logging
  if (LOG_CONFIG.enableConsole) {
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, entry.context);
        break;
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
        console.error(formattedMessage, entry.context, error);
        break;
    }
  }

  // Remote logging (futuro)
  if (LOG_CONFIG.enableRemote) {
    // Aquí se podría enviar a un servicio de logging como Sentry, LogRocket, etc.
    // sendToRemoteService(entry);
  }
}

// Funciones de conveniencia
export const logger = {
  debug: (message: string, context?: Partial<LogContext>) => 
    log('debug', message, context),
  
  info: (message: string, context?: Partial<LogContext>) => 
    log('info', message, context),
  
  warn: (message: string, context?: Partial<LogContext>, error?: Error) => 
    log('warn', message, context, error),
  
  error: (message: string, context?: Partial<LogContext>, error?: Error) => 
    log('error', message, context, error),
};

// Hook para logging en componentes
export function useLogger(componentName: string) {
  return {
    debug: (message: string, action?: string) => 
      logger.debug(message, { component: componentName, action }),
    
    info: (message: string, action?: string) => 
      logger.info(message, { component: componentName, action }),
    
    warn: (message: string, action?: string, error?: Error) => 
      logger.warn(message, { component: componentName, action }, error),
    
    error: (message: string, action?: string, error?: Error) => 
      logger.error(message, { component: componentName, action }, error),
  };
}

// Función para logging de performance
export function logPerformance(
  operation: string,
  startTime: number,
  context?: Partial<LogContext>
) {
  const duration = Date.now() - startTime;
  const level = duration > 1000 ? 'warn' : 'debug';
  
  log(level, `Performance: ${operation} took ${duration}ms`, {
    ...context,
    duration,
    operation,
  });
}

// Wrapper para funciones con logging automático
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  operation: string,
  component?: string
): T {
  return ((...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = fn(...args);
      
      // Si es una promesa, loggear cuando se resuelva
      if (result instanceof Promise) {
        return result
          .then((value) => {
            logPerformance(operation, startTime, { component, action: 'success' });
            return value;
          })
          .catch((error) => {
            logger.error(`Error in ${operation}`, { component, action: 'error' }, error);
            throw error;
          });
      }
      
      // Si es síncrono, loggear inmediatamente
      logPerformance(operation, startTime, { component, action: 'success' });
      return result;
    } catch (error) {
      logger.error(`Error in ${operation}`, { component, action: 'error' }, error as Error);
      throw error;
    }
  }) as T;
}
