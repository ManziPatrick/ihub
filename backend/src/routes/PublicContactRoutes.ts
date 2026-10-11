import { Router, Request, Response } from 'express';
import { sendEmail } from '../services/email.service';

const router = Router();

const INBOX = process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'info@bootskills.com';
const SITE = process.env.FRONTEND_URL || 'https://bootskills.com';
const hits = new Map<string, { n: number; t: number }>();

function rateOk(ip: string) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.t > 15 * 60_000) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  if (rec.n >= 8) return false;
  rec.n += 1;
  return true;
}

function clean(value: unknown, max = 400) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, max);
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/inquiry', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!rateOk(ip)) return res.status(429).json({ error: 'Please wait a bit, then try again.' });

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 160).toLowerCase();
    const phone = clean(req.body?.phone, 40);
    const subject = clean(req.body?.subject, 160) || 'Message from the website';
    const inquiryType = clean(req.body?.inquiryType, 40) || 'general';
    const message = clean(req.body?.message, 4000);

    if (!name || !validEmail(email) || !message) {
      return res.status(400).json({ error: 'Name, email, and a short message are required.' });
    }

    const bookUrl = `${SITE}/contact?book=1`;
    const adminHtml = `
      <p><strong>${name}</strong> wrote from the public contact page.</p>
      <p><strong>Email:</strong> ${email}<br/>
      <strong>Phone:</strong> ${phone || '—'}<br/>
      <strong>Type:</strong> ${inquiryType}</p>
      <p>${message.replace(/</g, '&lt;')}</p>
      <p><a href="${bookUrl}">Open the public meeting form</a></p>
    `;
    const visitorHtml = `
      <p>Hi ${name},</p>
      <p>We got your note. Someone from Bootskills will reply to this email.</p>
      <p>Want a call instead? Pick a time here: <a href="${bookUrl}">${bookUrl}</a></p>
      <p>— Bootskills, Kigali</p>
    `;

    await sendEmail({
      to: INBOX,
      replyTo: email,
      subject: `[Contact] ${subject} — ${name}`,
      html: adminHtml,
    });
    await sendEmail({
      to: email,
      subject: 'We got your message — Bootskills',
      html: visitorHtml,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[PublicContact] inquiry failed', err);
    res.status(500).json({ error: 'Could not send your message. Email us at info@bootskills.com.' });
  }
});

router.post('/meeting', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || 'unknown';
    if (!rateOk(ip)) return res.status(429).json({ error: 'Please wait a bit, then try again.' });

    const name = clean(req.body?.name, 120);
    const email = clean(req.body?.email, 160).toLowerCase();
    const phone = clean(req.body?.phone, 40);
    const date = clean(req.body?.date, 40);
    const time = clean(req.body?.time, 40);
    const topic = clean(req.body?.topic, 200) || 'Intro call';
    const notes = clean(req.body?.notes, 2000);

    if (!name || !validEmail(email) || !date || !time) {
      return res.status(400).json({ error: 'Name, email, date, and time are required.' });
    }

    const shareUrl = `${SITE}/contact?book=1`;
    const adminHtml = `
      <p><strong>${name}</strong> asked for a public meeting.</p>
      <p><strong>When:</strong> ${date} at ${time}<br/>
      <strong>Topic:</strong> ${topic}<br/>
      <strong>Email:</strong> ${email}<br/>
      <strong>Phone:</strong> ${phone || '—'}</p>
      ${notes ? `<p>${notes.replace(/</g, '&lt;')}</p>` : ''}
      <p>Reply to ${email} with a Google Meet / Zoom link.</p>
    `;
    const visitorHtml = `
      <p>Hi ${name},</p>
      <p>Your meeting request is in: <strong>${topic}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
      <p>We will email you the join link. You can share this booking page with anyone:</p>
      <p><a href="${shareUrl}">${shareUrl}</a></p>
      <p>— Bootskills</p>
    `;

    await sendEmail({
      to: INBOX,
      replyTo: email,
      subject: `[Meeting] ${name} — ${date} ${time}`,
      html: adminHtml,
    });
    await sendEmail({
      to: email,
      subject: `Meeting request received — ${date} ${time}`,
      html: visitorHtml,
    });

    res.json({ ok: true, shareUrl });
  } catch (err) {
    console.error('[PublicContact] meeting failed', err);
    res.status(500).json({ error: 'Could not book that time. Email us at info@bootskills.com.' });
  }
});

export default router;
