import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(to: string, token: string) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'AltynBurgut <noreply@altynburgut.com>',
    to,
    subject: 'Подтвердите ваш email — AltynBurgut',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a1a;">Добро пожаловать в AltynBurgut</h2>
        <p style="color: #555;">Нажмите кнопку ниже чтобы подтвердить ваш email адрес:</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 28px; background: #2563eb;
                  color: #fff; border-radius: 8px; text-decoration: none;
                  font-weight: 600; margin: 16px 0;">
          Подтвердить email
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Ссылка действует 24 часа. Если вы не регистрировались — проигнорируйте письмо.
        </p>
      </div>
    `,
  });
}
