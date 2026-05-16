const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM = `"${process.env.FROM_NAME || 'Arend Gesin Investment'}" <${process.env.FROM_EMAIL || 'info@arendgesin.co.ke'}>`;
const NOTIFY_TO = process.env.NOTIFY_TO || 'info@arendgesin.co.ke';

// ── Order notification to admin ──────────────────────────────────────────────
async function sendOrderNotification(order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return; // skip if not configured

  const html = `
    <div style="font-family:sans-serif;max-width:600px;color:#1A1A1A;">
      <h2 style="color:#A32D2D;">New Order Received — ${order.ref}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px;color:#555;width:130px;">Service</td><td style="padding:8px;font-weight:600;">${order.service}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">County</td><td style="padding:8px;">${order.county}</td></tr>
        <tr><td style="padding:8px;color:#555;">Item</td><td style="padding:8px;">${order.item || '—'}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Quantity</td><td style="padding:8px;">${order.qty || '—'}</td></tr>
        <tr><td style="padding:8px;color:#555;">Deadline</td><td style="padding:8px;">${order.deadline || 'Flexible'}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Budget</td><td style="padding:8px;">${order.budget || '—'}</td></tr>
        <tr><td style="padding:8px;color:#555;">Client</td><td style="padding:8px;">${[order.fname, order.lname].filter(Boolean).join(' ')}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Organisation</td><td style="padding:8px;">${order.org || '—'}</td></tr>
        <tr><td style="padding:8px;color:#555;">Email</td><td style="padding:8px;"><a href="mailto:${order.email}">${order.email}</a></td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Phone</td><td style="padding:8px;"><a href="tel:${order.phone}">${order.phone || '—'}</a></td></tr>
        <tr><td style="padding:8px;color:#555;">Heard via</td><td style="padding:8px;">${order.how || '—'}</td></tr>
      </table>
      ${order.details ? `<div style="margin-top:16px;padding:12px;background:#F8F7F4;border-left:3px solid #A32D2D;font-size:14px;"><strong>Additional Details:</strong><br>${order.details}</div>` : ''}
      <p style="margin-top:24px;font-size:12px;color:#888;">Arend Gesin Investment · Nakuru, Kenya</p>
    </div>
  `;

  await getTransporter().sendMail({
    from:    FROM,
    to:      NOTIFY_TO,
    subject: `[AGI Order ${order.ref}] ${order.service} — ${[order.fname, order.lname].filter(Boolean).join(' ')}`,
    html,
  });
}

// ── Order confirmation to client ─────────────────────────────────────────────
async function sendOrderConfirmation(order) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !order.email) return;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;color:#1A1A1A;">
      <h2 style="color:#A32D2D;">Thank You, ${order.fname}!</h2>
      <p>We've received your order request and our team will send you a personalised quote within <strong>24 hours</strong>.</p>
      <div style="margin:20px 0;padding:12px 20px;background:#F8F7F4;border-radius:8px;">
        Your reference number: <strong style="color:#A32D2D;">${order.ref}</strong>
      </div>
      <h3>Order Summary</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px;color:#555;width:130px;">Service</td><td style="padding:8px;">${order.service}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Item</td><td style="padding:8px;">${order.item || '—'}</td></tr>
        <tr><td style="padding:8px;color:#555;">Quantity</td><td style="padding:8px;">${order.qty || '—'}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">County</td><td style="padding:8px;">${order.county}</td></tr>
        <tr><td style="padding:8px;color:#555;">Budget</td><td style="padding:8px;">${order.budget || '—'}</td></tr>
      </table>
      <p style="margin-top:20px;">Have questions? Reply to this email or reach us at:</p>
      <ul style="font-size:14px;">
        <li>📞 <a href="tel:+254735518090">+254 735 518 090</a></li>
        <li>✉️ <a href="mailto:info@arendgesin.co.ke">info@arendgesin.co.ke</a></li>
        <li>💬 <a href="https://wa.me/254735518090">WhatsApp Us</a></li>
      </ul>
      <p style="margin-top:24px;font-size:12px;color:#888;">Arend Gesin Investment · P.O. Box 20100–12236, Nakuru, Kenya</p>
    </div>
  `;

  await getTransporter().sendMail({
    from:    FROM,
    to:      order.email,
    subject: `Your AGI Order Confirmed — ${order.ref}`,
    html,
  });
}

// ── Contact form notification to admin ───────────────────────────────────────
async function sendContactNotification(msg) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;color:#1A1A1A;">
      <h2 style="color:#A32D2D;">New Contact Message</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px;color:#555;width:100px;">Name</td><td style="padding:8px;">${[msg.fname, msg.lname].filter(Boolean).join(' ')}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Email</td><td style="padding:8px;"><a href="mailto:${msg.email}">${msg.email}</a></td></tr>
        <tr><td style="padding:8px;color:#555;">Phone</td><td style="padding:8px;">${msg.phone || '—'}</td></tr>
        <tr style="background:#F8F7F4;"><td style="padding:8px;color:#555;">Subject</td><td style="padding:8px;">${msg.subject || '—'}</td></tr>
      </table>
      <div style="margin-top:16px;padding:12px;background:#F8F7F4;border-left:3px solid #A32D2D;font-size:14px;">
        <strong>Message:</strong><br>${msg.message.replace(/\n/g,'<br>')}
      </div>
      <p style="margin-top:24px;font-size:12px;color:#888;">Arend Gesin Investment · Nakuru, Kenya</p>
    </div>
  `;

  await getTransporter().sendMail({
    from:    FROM,
    to:      NOTIFY_TO,
    replyTo: msg.email,
    subject: `[AGI Contact] ${msg.subject || 'General Enquiry'} — ${[msg.fname, msg.lname].filter(Boolean).join(' ')}`,
    html,
  });
}

module.exports = { sendOrderNotification, sendOrderConfirmation, sendContactNotification };
