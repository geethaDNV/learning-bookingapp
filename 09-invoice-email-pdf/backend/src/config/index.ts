import * as dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  provider: 'mock' | 'resend';
  apiKey?: string;
  from: string;
}

interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
}

interface AppConfig {
  email: EmailConfig;
  server: ServerConfig;
}

const config: AppConfig = {
  email: {
    provider: (process.env.EMAIL_PROVIDER as 'mock' | 'resend') || 'mock',
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@invoicedemo.local',
  },
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
  },
};

export default config;
