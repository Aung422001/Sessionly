import test from 'node:test';
import assert from 'node:assert/strict';
import { currency, nights, dateOnly, validGuests, safeNext, previewQuote, validateRates, money, localToday } from '../lib/domain.ts';
import { destinations, hotels, rooms, photoUrl } from '../lib/catalog.ts';
import { readStay } from '../lib/stay.ts';

test('calendar dates reject rollover, past ordering and invalid guest input', () => {
  assert.equal(nights('2028-02-28', '2028-03-02'), 3);
  assert.equal(nights('2027-03-13', '2027-03-15'), 2);
  for (const value of ['2027-02-29', '2027-13-01', 'bad', null]) assert.throws(() => dateOnly(value));
  assert.throws(() => nights('2027-01-02', '2027-01-01'));
  assert.throws(() => nights('2027-01-01', '2027-02-15'));
  for (const value of ['2.2', 'NaN', 0, -1, 4, Infinity]) assert.throws(() => validGuests(value));
  assert.equal(validGuests('2'), 2);
});

test('destination date follows hotel timezone rather than the browser', () => {
  assert.equal(localToday('Asia/Bangkok', new Date('2027-01-01T18:00:00Z')), '2027-01-02');
});

test('auth return paths cannot leave the application', () => {
  for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/\nevil', null]) assert.equal(safeNext(value), '/bookings');
  assert.equal(safeNext('/checkout?room=bangkok-1-double'), '/checkout?room=bangkok-1-double');
});

test('offline preview is exact USD pricing and never claims available inventory', () => {
  const quote = previewQuote({ id: 'sample', nightly_cents: 4000, fee_cents: 500 }, '2027-01-01', '2027-01-04');
  assert.equal(quote.subtotal, '120.00'); assert.equal(quote.total, '125.00');
  assert.equal(quote.currency, 'USD'); assert.equal(quote.available, false);
  assert.equal(money('3500', 'THB'), 'THB\u00a03,500.00');
  assert.equal(currency('BTC'), 'USD');
});

test('rate ingestion requires the complete USD-based currency contract', () => {
  const now = Date.parse('2027-01-01T12:00:00Z');
  const valid = { result: 'success', base_code: 'USD', time_last_update_unix: now / 1000, rates: { USD: 1, THB: 35, VND: 25000, KHR: 4000, MYR: 4.4, SGD: 1.3, IDR: 16000 } };
  assert.equal(validateRates(valid, now).rates.THB, '35');
  for (const rate of [0, -1, Infinity, NaN, '35', undefined]) assert.throws(() => validateRates({ ...valid, rates: { ...valid.rates, THB: rate } }, now));
  assert.throws(() => validateRates({ ...valid, base_code: 'EUR' }, now));
  assert.throws(() => validateRates({ ...valid, time_last_update_unix: now / 1000 + 3600 }, now));
  assert.throws(() => validateRates({ ...valid, time_last_update_unix: 1 }, now));
  assert.throws(() => validateRates(null, now));
});

test('catalog has eleven cities, unique rooms and bounded occupancy', () => {
  assert.equal(destinations.length, 11); assert.equal(hotels.length, 22);
  assert.equal(new Set(rooms.map(r => r.id)).size, rooms.length);
  for (const destination of destinations) assert.equal(hotels.filter(h => h.city === destination.id).length, 2);
  for (const room of rooms) { assert.ok(hotels.some(h => h.id === room.hotel_id)); assert.ok(room.capacity >= 1 && room.capacity <= 3); }
});

test('Myanmar destinations have searchable hotels and the correct half-hour timezone', () => {
  for (const id of ['yangon', 'mandalay', 'taunggyi', 'kalaw']) {
    const destination = destinations.find(d => d.id === id);
    assert.ok(destination); assert.equal(destination.country, 'Myanmar (Burma)');
    assert.equal(destination.timezone, 'Asia/Yangon');
    assert.equal(readStay({ city: id }).city, id);
    for (const hotel of hotels.filter(h => h.city === id)) assert.equal(rooms.filter(r => r.hotel_id === hotel.id).length, 2);
  }
  assert.equal(localToday('Asia/Yangon', new Date('2027-01-01T17:15:00Z')), '2027-01-01');
  assert.equal(localToday('Asia/Yangon', new Date('2027-01-01T17:45:00Z')), '2027-01-02');
});

test('Siem Reap uses the verified Angkor Wat photo and Wikimedia URLs are preserved', () => {
  assert.equal(destinations.find(d => d.id === 'siem-reap')?.photo, 'photo-1665386949480-75643c2de56f');
  const taunggyi = destinations.find(d => d.id === 'taunggyi')!;
  assert.equal(photoUrl(taunggyi.photo), taunggyi.photo);
  assert.match(photoUrl('photo-1665386949480-75643c2de56f', 600), /^https:\/\/images\.unsplash\.com\/photo-1665386949480-75643c2de56f\?/);
});
