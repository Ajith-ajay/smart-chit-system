import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().default(3001),

  APP_URL: z.string().url(),

  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number(),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_PASSWORD_RESET_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string(),

  JWT_REFRESH_EXPIRES_IN: z.string(),

  JWT_PASSWORD_RESET_EXPIRES_IN: z.string(),

  SEED_ADMIN_PASSWORD: z.string().min(6),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.email(),
  SMTP_PASSWORD: z.string(),
  MAIL_FROM: z.string(),

  LOCAL_DOCUMENT_STORAGE_DIR: z.string().default('storage/documents'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_GRAPH_VERSION: z.string().optional(),
  BATCH_AUTOMATION_ENABLED: z.coerce.boolean().default(false),
  BATCH_AUTOMATION_INTERVAL_MINUTES: z.coerce.number().int().min(5).default(60),
  WHATSAPP_AUTOMATION_ENABLED: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
