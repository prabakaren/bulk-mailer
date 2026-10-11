import { useMemo, useState } from 'react';
import api, { getErrorMessage } from '../api.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Compose() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientText, setRecipientText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type, message, failures }

  // split on commas, semicolons, spaces or new lines
  const { valid, invalid } = useMemo(() => {
    const all = [...new Set(
      recipientText.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
    )];
    return {
      valid: all.filter((e) => EMAIL_REGEX.test(e)),
      invalid: all.filter((e) => !EMAIL_REGEX.test(e)),
    };
  }, [recipientText]);

  const canSend = subject.trim() && body.trim() && valid.length > 0 && invalid.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/mail/send', { subject, body, recipients: valid });
      const { sentCount, failedCount, failures } = data.mail;
      setResult({
        type: failedCount ? 'warn' : 'success',
        message: failedCount
          ? `${sentCount} sent, ${failedCount} failed.`
          : `Sent to ${sentCount} recipient${sentCount > 1 ? 's' : ''}.`,
        failures,
      });
      if (!failedCount) {
        setSubject('');
        setBody('');
        setRecipientText('');
      }
    } catch (err) {
      setResult({ type: 'error', message: getErrorMessage(err), failures: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <h2>New email</h2>

      <form className="panel" onSubmit={handleSubmit}>
        {result && (
          <div className={`alert alert-${result.type}`} role="status">
            <strong>{result.message}</strong>
            {result.failures?.length > 0 && (
              <ul>
                {result.failures.slice(0, 5).map((f) => (
                  <li key={f.email}>{f.email}: {f.error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label htmlFor="subject">Subject</label>
        <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />

        <label htmlFor="recipients">Recipients</label>
        <textarea
          id="recipients"
          rows={5}
          value={recipientText}
          onChange={(e) => setRecipientText(e.target.value)}
          placeholder="Paste emails separated by commas, spaces or new lines"
        />
        <p className="hint">
          {valid.length} valid
          {invalid.length > 0 && (
            <span className="text-error"> · {invalid.length} invalid: {invalid.slice(0, 3).join(', ')}{invalid.length > 3 && '...'}</span>
          )}
        </p>

        <label htmlFor="body">Message</label>
        <textarea id="body" rows={9} value={body} onChange={(e) => setBody(e.target.value)} />

        <button className="btn btn-primary" disabled={!canSend || loading}>
          {loading ? `Sending to ${valid.length}...` : `Send to ${valid.length || ''} ${valid.length === 1 ? 'recipient' : 'recipients'}`}
        </button>
      </form>
    </main>
  );
}
