export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '3001', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    url: process.env.APP_URL,
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
  },

  storage: {
    localDirectory:
      process.env.LOCAL_DOCUMENT_STORAGE_DIR ?? 'storage/documents',
  },

  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION,
  },

  automation: {
    batchEnabled: process.env.BATCH_AUTOMATION_ENABLED === 'true',
    intervalMinutes: parseInt(
      process.env.BATCH_AUTOMATION_INTERVAL_MINUTES ?? '60',
      10,
    ),
    whatsappEnabled: process.env.WHATSAPP_AUTOMATION_ENABLED === 'true',
  },

  auth: {
    passwordResetExpiryMinutes: parseInt(
      process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES ?? '15',
      10,
    ),
  },
});
