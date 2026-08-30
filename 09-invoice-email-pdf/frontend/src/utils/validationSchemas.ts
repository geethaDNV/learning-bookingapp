import { z } from 'zod';

/**
 * Frontend validation schema for send email form.
 * 
 * Note: Email addresses are validated by backend too.
 * This is client-side validation for UX.
 */
export const sendEmailFormSchema = z.object({
  to: z.string().email('Invalid email address').min(1, 'Required'),
  cc: z.string().optional().default(''),
  bcc: z.string().optional().default(''),
  subject: z
    .string()
    .min(1, 'Required')
    .max(255, 'Subject too long'),
  body: z
    .string()
    .min(1, 'Required')
    .max(10000, 'Body too long'),
  attachPdf: z.boolean().default(true),
  paymentLink: z.string().url().optional().or(z.literal('')),
});

export type SendEmailFormSchemaType = z.infer<typeof sendEmailFormSchema>;

/**
 * Helper to parse CSV email string into array.
 * "email1@ex.com, email2@ex.com" → ["email1@ex.com", "email2@ex.com"]
 */
export const parseEmailCSV = (csv: string): string[] => {
  return csv
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

/**
 * Helper to format email array into CSV string.
 * ["email1@ex.com", "email2@ex.com"] → "email1@ex.com, email2@ex.com"
 */
export const formatEmailCSV = (emails: string[]): string => {
  return emails.join(', ');
};
