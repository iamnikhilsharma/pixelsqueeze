let requestHandler = null;
let errorHandler = null;

try {
  const Sentry = require('@sentry/node');
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
    requestHandler = Sentry.Handlers.requestHandler();
    errorHandler = Sentry.Handlers.errorHandler();
  }
} catch (e) {
  // Sentry not installed or failed to init; ignore
}

module.exports = { requestHandler, errorHandler };