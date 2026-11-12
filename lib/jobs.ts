import 'server-only';
import { maintenanceDatabase } from './supabase.ts';
import { notificationText, type EmailEvent } from './email.ts';
import { validateRates } from './domain.ts';

export async function refreshRates() {
  const db = maintenanceDatabase();
  const latest = await db.from('exchange_rate_sets').select('fetched_at').order('source_at', { ascending: false }).limit(1).maybeSingle();
  if (latest.error) throw new Error('Saved rates unavailable.');
  if (latest.data && Date.now() - Date.parse(latest.data.fetched_at) < 86400000) return;
  const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Rate source unavailable. Saved prices remain available.');
  const { rates, source_at } = validateRates(await response.json());
  const { error } = await db.rpc('save_rates', { p_at: source_at, p_rates: rates });
  if (error) throw new Error('Exchange rates were not saved.');
}

export async function deliverNotifications() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const db = maintenanceDatabase();
  for (let index = 0; index < 10; index++) {
    const { data, error } = await db.rpc('claim_notification');
    if (error) throw new Error('Notification queue unavailable.');
    if (!data) break;
    const event = data as EmailEvent;
    let result = 'failed';
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': event.id },
        body: JSON.stringify({ from: process.env.RESEND_FROM, to: [event.recipient], ...notificationText(event) }),
      });
      result = response.ok ? 'sent' : response.status >= 400 && response.status < 500 && response.status !== 429 ? 'attention' : 'failed';
    } catch { /* Delivery retries reuse the same persisted event and provider key. */ }
    const settled = await db.rpc('finish_notification', { p_id: event.id, p_lease: event.lease, p_result: result });
    if (settled.error) throw new Error('Delivery result could not be saved.');
  }
}
