'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createPairingAuthorizer } = require('../lib/owner-auth');

test('requires a high-entropy-length owner token', () => {
  assert.throws(() => createPairingAuthorizer('too-short'), /at least 32/);
});

test('authorizes only an exact token supplied by a trusted actor object', async () => {
  const authorize = createPairingAuthorizer('a'.repeat(48));
  assert.equal(await authorize({ pairingToken: 'a'.repeat(48) }), true);
  assert.equal(await authorize({ pairingToken: 'b'.repeat(48) }), false);
  assert.equal(await authorize({ pairingToken: 'a'.repeat(47) }), false);
  assert.equal(await authorize('a'.repeat(48)), false);
  assert.equal(await authorize(null), false);
});

test('does not coerce non-string credentials', async () => {
  const authorize = createPairingAuthorizer('a'.repeat(48));
  assert.equal(await authorize({ pairingToken: 123 }), false);
});
