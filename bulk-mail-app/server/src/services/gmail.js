import { google } from 'googleapis';

// Gmail API goes over HTTPS (port 443), so it works on Vercel/Render
// where outgoing SMTP ports are usually blocked.

let gmailClient;

function getGmail() {
  if (gmailClient) return gmailClient;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth credentials are missing in environment variables');
  }

  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  gmailClient = google.gmail({ version: 'v1', auth });
  return gmailClient;
}

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// non-ascii subjects (emoji, tamil, etc.) need to be encoded
const encodeSubject = (subject) =>
  `=?UTF-8?B?${Buffer.from(subject.replace(/[\r\n]+/g, ' '), 'utf-8').toString('base64')}?=`;

function buildRawMessage({ from, to, subject, body }) {
  const html = escapeHtml(body).replace(/\r?\n/g, '<br>');
  const encodedBody = Buffer.from(html, 'utf-8').toString('base64').match(/.{1,76}/g).join('\r\n');

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody,
  ].join('\r\n');

  return Buffer.from(message).toString('base64url');
}

export async function sendMail({ to, subject, body }) {
  const gmail = getGmail();
  const raw = buildRawMessage({ from: process.env.GMAIL_USER, to, subject, body });

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
  return res.data;
}

// send in small batches so we don't hit Gmail rate limits
export async function sendBulk(recipients, { subject, body }, batchSize = 5) {
  const sent = [];
  const failures = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((to) => sendMail({ to, subject, body }))
    );

    results.forEach((result, idx) => {
      const email = batch[idx];
      if (result.status === 'fulfilled') {
        sent.push(email);
      } else {
        const error =
          result.reason?.response?.data?.error?.message ||
          result.reason?.message ||
          'Unknown error';
        console.error(`Failed to send to ${email}:`, error);
        failures.push({ email, error });
      }
    });
  }

  return { sent, failures };
}
