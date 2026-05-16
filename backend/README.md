# AGI Backend — Arend Gesin Investment API

A lightweight Node.js / Express / MongoDB backend that powers:

- 📦 **Order submissions** from `index.html`
- 📬 **Contact form** from `contact.html`
- 🔒 **Admin dashboard** (`admin.html`) — list orders, update status
- 📧 **Email notifications** (Nodemailer via Gmail or any SMTP)

---

## Project Structure

```
agi-backend/
├── src/
│   ├── server.js           ← Entry point
│   ├── mailer.js           ← Nodemailer helper
│   ├── models/
│   │   ├── Order.js        ← Mongoose Order schema
│   │   └── Contact.js      ← Mongoose Contact schema
│   ├── routes/
│   │   ├── orders.js       ← POST /api/orders, GET /api/orders/:ref
│   │   ├── contact.js      ← POST /api/contact
│   │   └── admin.js        ← All /api/admin/* (protected)
│   └── middleware/
│       └── adminAuth.js    ← x-admin-key header check
├── .env.example
├── package.json
└── README.md
```

---

## Quick Start (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env`
```bash
cp .env.example .env
# then edit .env with your real values
```

### 3. Set up MongoDB
- Free cloud cluster: https://cloud.mongodb.com  
- Create a database named `agi`
- Copy the connection string into `MONGO_URI` in `.env`

### 4. Set up Gmail App Password (for emails)
- Go to https://myaccount.google.com/apppasswords
- Generate a password for "Mail"
- Paste it into `SMTP_PASS` in `.env`

### 5. Run
```bash
npm run dev   # development (auto-restart)
npm start     # production
```

Server starts at `http://localhost:3001`

---

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/orders` | Submit a new order |
| `GET`  | `/api/orders/:ref` | Look up an order by reference |
| `POST` | `/api/contact` | Submit a contact message |

#### POST /api/orders — body fields
```json
{
  "service":  "Printing & Branding",
  "county":   "Nakuru",
  "item":     "Business cards",
  "qty":      "500",
  "deadline": "2025-08-01",
  "details":  "Double-sided, glossy finish",
  "budget":   "KES 5,000 – 15,000",
  "fname":    "John",
  "lname":    "Kamau",
  "org":      "Kamau Enterprises",
  "email":    "john@example.com",
  "phone":    "+254 700 000 000",
  "how":      "Referral"
}
```

Response:
```json
{ "ok": true, "ref": "AGI-123456ABC", "_id": "..." }
```

---

### Admin Endpoints (require `x-admin-key` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/orders` | List all orders |
| `PATCH` | `/api/admin/orders/:id/status` | Update order status |
| `DELETE` | `/api/admin/orders/:id` | Delete an order |
| `GET` | `/api/admin/contacts` | List all contact messages |
| `PATCH` | `/api/admin/contacts/:id/read` | Mark message as read |
| `GET` | `/api/admin/stats` | Summary stats |

Admin key is set in `.env` as `ADMIN_KEY` (default: `agi-admin-2025`).

---

## Deploy to Render (Free)

Your `admin.html` already points to `https://agi-backend-8cdh.onrender.com`.

1. Push this folder to a GitHub repository
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add all your `.env` variables under **Environment Variables**
6. Deploy — Render gives you a URL like `https://agi-backend-xxxx.onrender.com`
7. Update `ALLOWED_ORIGINS` to include your live frontend domain

---

## Wiring the Frontend

### index.html — replace `submitOrder()` with this:

```javascript
async function submitOrder() {
  if (!validateStep(3)) return;

  const service  = document.querySelector('input[name="service"]:checked')?.value || '';
  const county   = document.getElementById('county').value;
  const item     = document.getElementById('item').value.trim();
  const qty      = document.getElementById('qty').value;
  const deadline = document.getElementById('deadline').value.trim();
  const details  = document.getElementById('details').value.trim();
  const budget   = document.getElementById('budget').value;
  const fname    = document.getElementById('fname').value.trim();
  const lname    = document.getElementById('lname').value.trim();
  const org      = document.getElementById('org').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const how      = document.getElementById('how').value;

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Submitting…';

  try {
    const res = await fetch('https://agi-backend-8cdh.onrender.com/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, county, item, qty, deadline, details, budget,
                             fname, lname, org, email, phone, how }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submission failed');

    // Redirect to success page with order summary in URL
    const params = new URLSearchParams({ ref: data.ref, service, county, item, qty,
                                         deadline, budget, fname, lname, phone, email });
    window.location.href = '/pages/success.html?' + params.toString();
  } catch (err) {
    alert('Sorry — ' + err.message + '. Please try again or call us directly.');
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Submit Order →';
  }
}
```

### contact.html — replace the form submit handler:

```javascript
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const msg = document.getElementById('successMsg');
  btn.classList.add('loading');

  try {
    const res = await fetch('https://agi-backend-8cdh.onrender.com/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fname:   document.getElementById('fname').value.trim(),
        lname:   document.getElementById('lname').value.trim(),
        email:   document.getElementById('email').value.trim(),
        phone:   document.getElementById('phone').value.trim(),
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value.trim(),
      }),
    });
    if (!res.ok) throw new Error('Failed');
    msg.classList.add('show');
    this.reset();
    setTimeout(() => msg.classList.remove('show'), 6000);
  } catch {
    alert('Sorry, something went wrong. Please email us directly at info@arendgesin.co.ke');
  } finally {
    btn.classList.remove('loading');
  }
});
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default 3001) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `ADMIN_KEY` | **Yes** | Secret key for admin panel |
| `SMTP_HOST` | No | SMTP host (default: smtp.gmail.com) |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No* | Email address for sending |
| `SMTP_PASS` | No* | Gmail App Password |
| `NOTIFY_TO` | No | Where to send notifications |
| `FROM_NAME` | No | Sender display name |
| `FROM_EMAIL` | No | Sender email address |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

*Emails are silently skipped if SMTP is not configured — orders still save to the database.
