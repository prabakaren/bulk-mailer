import { Router } from 'express';
import Mail from '../models/Mail.js';
import requireAuth from '../middleware/auth.js';
import { sendBulk } from '../services/gmail.js';

const router = Router();
router.use(requireAuth);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/mail/send
router.post('/send', async (req, res) => {
  try {
    const { subject, body, recipients } = req.body || {};

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'Subject and email body are required' });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Add at least one recipient' });
    }

    const unique = [...new Set(recipients.map((e) => String(e).trim().toLowerCase()))];
    const invalid = unique.filter((e) => !EMAIL_REGEX.test(e));
    if (invalid.length) {
      return res.status(400).json({
        message: `Invalid email address: ${invalid.slice(0, 5).join(', ')}`,
      });
    }

    const max = Number(process.env.MAX_RECIPIENTS) || 100;
    if (unique.length > max) {
      return res.status(400).json({ message: `You can send to ${max} recipients at a time` });
    }

    console.log(`Sending "${subject}" to ${unique.length} recipients`);
    const { sent, failures } = await sendBulk(unique, { subject: subject.trim(), body });

    let status = 'sent';
    if (sent.length === 0) status = 'failed';
    else if (failures.length > 0) status = 'partial';

    const record = await Mail.create({
      subject: subject.trim(),
      body,
      recipients: unique,
      status,
      sentCount: sent.length,
      failedCount: failures.length,
      failures,
      sentBy: req.user.username,
    });

    console.log(`Done: ${sent.length} sent, ${failures.length} failed`);
    res.status(status === 'failed' ? 502 : 200).json({
      message:
        status === 'sent'
          ? 'All emails sent successfully'
          : status === 'partial'
          ? 'Some emails could not be sent'
          : 'No emails were sent',
      mail: record,
    });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ message: err.message || 'Failed to send emails' });
  }
});

// GET /api/mail/history
router.get('/history', async (req, res) => {
  try {
    const mails = await Mail.find().sort({ createdAt: -1 }).limit(100);
    res.json(mails);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: 'Could not load email history' });
  }
});

// DELETE /api/mail/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Mail.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Could not delete record' });
  }
});

export default router;
