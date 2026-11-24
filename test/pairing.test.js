'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePairingNumber, requestPairingCode } = require('../lib/pairing');

test('accepts an international number in digits-only format', () => {
  assert.equal(validatePairingNumber('254712345678'), '254712345678');
});

test('rejects local, formatted, non-string, and out-of-range numbers', () => {
  for (const value of ['0712345678', '+254712345678', '254 712345678', '254-712345678', '1234567', '1234567890123456', 254712345678, null]) {
    assert.throws(() => validatePairingNumber(value), TypeError);
  }
});

test('requests a pairing code only for an unregistered socket', async () => {
  let requestedNumber;
  const credentials = { registered: false };
  const socket = {
    requestPairingCode: async number => {
      requestedNumber = number;
      return 'ABCD-EFGH';
    }
  };

  assert.equal(await requestPairingCode(socket, '254712345678', credentials), 'ABCD-EFGH');
  assert.equal(requestedNumber, '254712345678');
});

test('refuses pairing when the session is already registered', async () => {
  const socket = {
    requestPairingCode: async () => 'SHOULD_NOT_RUN'
  };
  await assert.rejects(() => requestPairingCode(socket, '254712345678', { registered: true }), /unregistered session/);
});

test('refuses an invalid socket', async () => {
  await assert.rejects(() => requestPairingCode({}, '254712345678', { registered: false }), TypeError);
});
