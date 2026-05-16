const router  = require('express').Router();
const Contact = require('../models/Contact');
const { sendContactNotification } = require('../mailer');

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { fname, email, message } = req.body;
    if (!fname || !email || !message) {
      return res.status(400).json({ error: 'fname, email and message are required' });
    }

    const msg = await Contact.create(req.body);

    sendContactNotification(msg).catch(err => console.error('[mailer] contact notify:', err.message));

    return res.status(201).json({ ok: true, id: msg._id });
  } catch (err) {
    console.error('[contact] POST error:', err.message);
    return res.status(500).json({ error: 'Server error — please try again.' });
  }
});

module.exports = router;
