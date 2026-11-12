import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationText, type EmailEvent } from '../lib/email.ts';
import { previewQuote } from '../lib/domain.ts';

test('booking and cancellation emails use saved amounts and explicit demo labels', () => {
  const event: EmailEvent = { id: 'event', lease: 'lease', kind: 'booking', recipient: 'verified@example.test', payload: { reference: 'ref-123', check_in: '2027-01-01', check_out: '2027-01-04', guests: 2, quote: previewQuote({ id: 'room', nightly_cents: 4000, fee_cents: 500 }, '2027-01-01', '2027-01-04'), snapshot: { hotel: '<Fictional hotel>', room: 'Double', terms: 'Free cancellation before local check-in.' } } };
  const booking = notificationText(event);
  assert.match(booking.subject, /demo.*no real reservation/);
  assert.match(booking.text, /125\.00/); assert.match(booking.text, /ref-123/);
  assert.match(booking.text, /<Fictional hotel>/); assert.equal('html' in booking, false);
  const cancellation = notificationText({ ...event, kind: 'cancellation' });
  assert.match(cancellation.text, /No real refund transaction occurred/);
  assert.match(cancellation.subject, /demo cancellation/);
});
