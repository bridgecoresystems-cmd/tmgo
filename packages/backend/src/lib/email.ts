import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM = 'TMGO <noreply@bcs301.site>';

export async function sendOtpEmail(to: string, code: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${code} — код подтверждения TMGO`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">Подтвердите email</h2>
        <p style="color:#555;margin:0 0 24px;">Введите этот код в приложении:</p>
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#ff6b4a;
                    background:#fff8f6;border:2px solid #ffd4c8;border-radius:12px;
                    text-align:center;padding:20px 16px;margin-bottom:24px;">
          ${code}
        </div>
        <p style="color:#999;font-size:12px;margin:0;">
          Код действует 15 минут. Если вы не регистрировались — проигнорируйте письмо.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, code: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${code} — сброс пароля TMGO`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a1a;margin:0 0 8px;">Сброс пароля</h2>
        <p style="color:#555;margin:0 0 24px;">Введите этот код для сброса пароля:</p>
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#ff6b4a;
                    background:#fff8f6;border:2px solid #ffd4c8;border-radius:12px;
                    text-align:center;padding:20px 16px;margin-bottom:24px;">
          ${code}
        </div>
        <p style="color:#999;font-size:12px;margin:0;">
          Код действует 15 минут. Если вы не запрашивали сброс — проигнорируйте письмо.
        </p>
      </div>
    `,
  });
}
