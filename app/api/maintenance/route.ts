import { validMaintenanceToken } from '@/lib/security';
import { refreshRates, deliverNotifications } from '@/lib/jobs';

export async function POST(request: Request) {
  if (!validMaintenanceToken(request.headers.get('authorization'), process.env.CRON_SECRET)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  let rates = 'updated';
  try { await refreshRates(); } catch { rates = 'unavailable; saved-rate/USD fallback remains active'; }
  try { await deliverNotifications(); }
  catch { return Response.json({ rates, email: 'Queue processing failed; no booking changes were made.' }, { status: 503 }); }
  return Response.json({ rates, email: process.env.RESEND_API_KEY ? 'processed' : 'not configured' });
}
