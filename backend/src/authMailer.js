const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FROM = `"Arend Gesin Investment" <${process.env.FROM_EMAIL || 'info@arendgesin.co.ke'}>`;

async function sendOTPEmail(email, fname, otp) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP not configured — OTP:', otp);
    return;
  }

  await getTransporter().sendMail({
    from:    FROM,
    to:      email,
    subject: `Your AGI Password Reset Code — ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;color:#1A1A1A;">
        <h2 style="color:#A32D2D;">Password Reset</h2>
        <p>Hi ${fname},</p>
        <p>Use the code below to reset your password. It expires in <strong>15 minutes</strong>.</p>
        <div style="margin:28px 0;text-align:center;">
          <span style="display:inline-block;padding:16px 40px;background:#1A1A1A;color:#fff;
                       font-size:32px;font-weight:700;letter-spacing:10px;border-radius:8px;">
            ${otp}
          </span>
        </div>
        <p style="color:#555;font-size:13px;">If you didn't request this, ignore this email — your password won't change.</p>
        <p style="margin-top:24px;font-size:12px;color:#888;">Arend Gesin Investment · Nakuru, Kenya</p>
      </div>
    `,
  });
}

async function sendWelcomeEmail(email, fname) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  await getTransporter().sendMail({
    from:    FROM,
    to:      email,
    subject: `Welcome to Arend Gesin Investment, ${fname}!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;color:#1A1A1A;">
        <h2 style="color:#A32D2D;">Welcome, ${fname}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now place orders, track their status, and manage your profile at any time.</p>
        <div style="margin:20px 0;">
          <a href="https://agi-website2.vercel.app" 
             style="display:inline-block;padding:12px 28px;background:#A32D2D;color:#fff;
                    border-radius:99px;text-decoration:none;font-weight:500;">
            Visit our website
          </a>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#888;">
          Arend Gesin Investment · +254 735 518 090 · info@arendgesin.co.ke
        </p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
