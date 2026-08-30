import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  databaseUrl: string;
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    publicAppUrl: string;
  };
  paymentProvider: "razorpay" | "mock";
}

const config: Config = {
  port: parseInt(process.env.PORT || "3001"),
  databaseUrl: process.env.DATABASE_URL || "",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    publicAppUrl: process.env.APP_PUBLIC_URL || "http://localhost:3001",
  },
  paymentProvider: (process.env.PAYMENT_PROVIDER as "razorpay" | "mock") || "mock",
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default config;
