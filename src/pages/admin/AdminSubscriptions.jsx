import React, { useEffect, useState } from 'react';
import { subscriptions as subsApi } from '../../services/api';

const STATUSES = ['pending', 'approved', 'rejected'];

const StatusPill = ({ status }) => {
  const colors = {
    pending: { bg: '#fef3c7', fg: '#92400e' },
    approved: { bg: '#d1fae5', fg: '#065f46' },
    rejected: { bg: '#fee2e2', fg: '#991b1b' },
  }[status] || { bg: '#e5e7eb', fg: '#374151' };
  return (
    <span style={{
      display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      background: colors.bg, color: colors.fg, letterSpacing: 0.4,
    }}>{status}</span>
  );
};

const AdminSubscriptions = () => {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // { id, decision }
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (s = status) => {
    setLoading(true);
    try {
      const res = await subsApi.adminList(s);
      setRows(res.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]);

  const submitReview = async () => {
    if (!reviewing) return;
    setBusy(true);
    try {
      await subsApi.adminReview(reviewing.id, reviewing.decision, notes);
      setReviewing(null);
      setNotes('');
      load(status);
    } catch (err) {
      alert(err.message || 'Failed to submit decision');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Subscription Payments</h1>
          <p style={{ color: '#64748b' }}>Review and approve vendor bank-transfer submissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                padding: '0.5rem 1rem', borderRadius: 999,
                border: '1px solid ' + (status === s ? '#3b82f6' : '#e2e8f0'),
                background: status === s ? '#3b82f6' : 'white',
                color: status === s ? 'white' : '#374151',
                fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No {status} submissions.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Vendor</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Plan</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Amount</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Reference</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Submitted</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.shop_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.vendor_email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textTransform: 'uppercase', fontWeight: 600 }}>{r.plan}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>₦{Number(r.amount).toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{r.reference}</code>
                    {r.note && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem' }}>{r.note}</div>}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#374151' }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}><StatusPill status={r.status} /></td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => { setReviewing({ id: r.id, decision: 'approved' }); setNotes(''); }}
                          style={{ background: '#16a34a', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                        >Approve</button>
                        <button
                          onClick={() => { setReviewing({ id: r.id, decision: 'rejected' }); setNotes(''); }}
                          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                        >Reject</button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reviewing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50,
        }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 480, width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
              {reviewing.decision === 'approved' ? 'Approve payment' : 'Reject payment'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {reviewing.decision === 'approved'
                ? 'Confirm the transfer landed in our Moniepoint account before approving. The vendor will be upgraded and notified by email.'
                : 'Let the vendor know what was wrong so they can re-submit.'}
            </p>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Notes {reviewing.decision === 'rejected' ? '*' : '(optional)'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={reviewing.decision === 'rejected' ? 'e.g. Reference not found in our account' : 'Internal note (optional)'}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, minHeight: 80, marginBottom: '1rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setReviewing(null); setNotes(''); }}
                disabled={busy}
                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.55rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={submitReview}
                disabled={busy || (reviewing.decision === 'rejected' && !notes.trim())}
                style={{
                  background: reviewing.decision === 'approved' ? '#16a34a' : '#dc2626',
                  color: 'white', border: 'none', padding: '0.55rem 1rem', borderRadius: 8, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Submitting…' : reviewing.decision === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptions;
