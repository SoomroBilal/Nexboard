import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  email,
  token,
  invitedByName,
  companyName,
}: {
  email: string;
  token: string;
  invitedByName: string;
  companyName: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/auth/signup?invite=${token}`;

  const { error } = await resend.emails.send({
    from: `Nexboard <${process.env.RESEND_SENDER_EMAIL}>`,
    to: email,
    subject: `${invitedByName} invited you to ${companyName} on Nexboard`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; color: #7c3aed; margin: 0;">Nexboard</h1>
        </div>
        <h2 style="font-size: 20px; margin-bottom: 8px;">You're invited!</h2>
        <p style="color: #525252; line-height: 1.6;">
          <strong>${invitedByName}</strong> has invited you to join <strong>${companyName}</strong> on Nexboard — the AI-powered onboarding platform.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Accept Invite
          </a>
        </div>
        <p style="color: #a3a3a3; font-size: 14px;">
          This invite expires in 7 days. If you weren't expecting this, you can ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    throw new Error(error.message);
  }
}
