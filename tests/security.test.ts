import test from 'node:test';
import assert from 'node:assert/strict';
import { validMaintenanceToken, allowedOrigin } from '../lib/security.ts';

test('maintenance rejects missing, short, malformed and incorrect credentials', () => {
  const secret = 'a'.repeat(64);
  for (const header of [null, '', secret, 'Bearer b', `Bearer ${'b'.repeat(64)}`]) assert.equal(validMaintenanceToken(header, secret), false);
  assert.equal(validMaintenanceToken(`Bearer ${secret}`, secret), true);
  assert.equal(validMaintenanceToken('Bearer abc', 'abc'), false);
  assert.equal(validMaintenanceToken(`Bearer ${secret}`, undefined), false);
});

test('mutations require the exact configured origin', () => {
  assert.equal(allowedOrigin('https://sessionly.example', 'https://sessionly.example'), true);
  for (const origin of [null, 'https://evil.example', 'http://sessionly.example', 'https://sessionly.example.evil.example', 'garbage']) assert.equal(allowedOrigin(origin, 'https://sessionly.example'), false);
});
