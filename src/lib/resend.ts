import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDigestEmail(
  to: string,
  subject: string,
  reactElement: React.ReactElement
) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'Trident <onboarding@resend.dev>',
    to: [to],
    subject,
    react: reactElement,
  });

  if (error) {
    console.error('Failed to send digest email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
