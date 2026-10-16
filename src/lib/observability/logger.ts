type LogContext = Record<string, string | number | boolean | null | undefined>;

function writeLog(level: "info" | "error", message: string, context: LogContext = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }
  console.info(serialized);
}

export const logger = {
  info: (message: string, context?: LogContext) => writeLog("info", message, context),
  error: (message: string, context?: LogContext) => writeLog("error", message, context),
};
