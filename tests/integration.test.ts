import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const { TEST_SUPABASE_URL: base, TEST_SUPABASE_KEY: key, TEST_USER_A_TOKEN: a, TEST_USER_B_TOKEN: b, TEST_ROOM_ID: room, TEST_CHECK_IN: start, TEST_CHECK_OUT: end } = process.env;
const ready = Boolean(base && key && a && b && room && start && end);

test('live database: concurrent last-room requests, ownership, duplicate requests and cancellation', { skip: !ready }, async () => {
  async function rpc(name: string, token: string, payload: object) {
    const response = await fetch(`${base}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: key!, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return { ok: response.ok, data: await response.json() };
  }
  const firstQuote = await rpc('stay_quote', a!, { p_room: room, p_in: start, p_out: end, p_guests: 2, p_currency: 'USD' });
  assert.equal(firstQuote.ok, true); assert.equal(firstQuote.data.available, true);
  const q = firstQuote.data;
  const payload = { p_room: room, p_in: start, p_out: end, p_guests: 2, p_currency: 'USD', p_reviewed: { currency: q.currency, total: q.total, rate: q.rate, rate_id: q.rate_id }, p_name: 'Integration Guest', p_email: 'contact@example.test' };
  const attempts = [randomUUID(), randomUUID()];
  const outcomes = await Promise.all([rpc('confirm_booking', a!, { ...payload, p_request: attempts[0] }), rpc('confirm_booking', b!, { ...payload, p_request: attempts[1] })]);
  assert.equal(outcomes.filter(o => o.ok).length, 1, 'Use a dedicated room with exactly one available room on every test night.');
  const winnerIndex = outcomes[0].ok ? 0 : 1; const winner = outcomes[winnerIndex];
  const token = winnerIndex === 0 ? a! : b!; const other = winnerIndex === 0 ? b! : a!;
  try {
    const replay = await rpc('confirm_booking', token, { ...payload, p_request: attempts[winnerIndex] });
    assert.equal(replay.data, winner.data);
    const read = await fetch(`${base}/rest/v1/bookings?id=eq.${winner.data}&select=id`, { headers: { apikey: key!, Authorization: `Bearer ${other}` } });
    assert.deepEqual(await read.json(), []);
    assert.equal((await rpc('cancel_booking', other, { p_booking: winner.data })).ok, false);
    assert.equal((await rpc('cancel_booking', token, { p_booking: winner.data })).ok, true);
    assert.equal((await rpc('cancel_booking', token, { p_booking: winner.data })).ok, true);
    assert.equal((await rpc('stay_quote', token, { p_room: room, p_in: start, p_out: end, p_guests: 2, p_currency: 'USD' })).data.available, true);
  } finally {
    await rpc('cancel_booking', token, { p_booking: winner.data });
  }
});
