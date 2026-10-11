import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api.js';

const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function History() {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/mail/history');
      setMails(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/mail/${id}`);
      setMails((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="page page-wide">
      <h2>Sent emails</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && mails.length === 0 && (
        <p className="muted">Nothing sent yet. Emails you send will show up here.</p>
      )}

      {mails.length > 0 && (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Sent on</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mails.map((m) => (
                <MailRow
                  key={m._id}
                  mail={m}
                  open={openId === m._id}
                  onToggle={() => setOpenId(openId === m._id ? null : m._id)}
                  onDelete={() => handleDelete(m._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function MailRow({ mail, open, onToggle, onDelete }) {
  return (
    <>
      <tr>
        <td><button className="link" onClick={onToggle}>{mail.subject}</button></td>
        <td>{mail.sentCount}/{mail.recipients.length}</td>
        <td><span className={`badge badge-${mail.status}`}>{mail.status}</span></td>
        <td>{formatDate(mail.createdAt)}</td>
        <td className="right"><button className="btn btn-ghost" onClick={onDelete}>Delete</button></td>
      </tr>
      {open && (
        <tr className="details">
          <td colSpan={5}>
            <p className="pre">{mail.body}</p>
            <p className="hint"><strong>To:</strong> {mail.recipients.join(', ')}</p>
            {mail.failures?.length > 0 && (
              <p className="text-error">
                <strong>Failed:</strong> {mail.failures.map((f) => `${f.email} (${f.error})`).join('; ')}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
