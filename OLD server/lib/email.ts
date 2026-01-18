import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'WebStudioAMS <onboarding@resend.dev>', // Default resend sender
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email Error:", error);
  }
}
