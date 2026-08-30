// Configuration

import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/customers_db?schema=public',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
