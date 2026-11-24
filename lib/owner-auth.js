'use strict';

const crypto = require('node:crypto');

const MIN_TOKEN_BYTES = 32;

/**
 * Build an owner-pairing gate for a trusted local/HTTP boundary.
 * The actor must be created by that boundary, never from a WhatsApp message.
 */
function createPairingAuthorizer(expectedToken) {
  if (typeof expectedToken !== 'string' ||
      Buffer.byteLength(expectedToken, 'utf8') < MIN_TOKEN_BYTES) {
    throw new TypeError('SHADOW_PAIRING_TOKEN must contain at least 32 UTF-8 bytes.');
  }

  const expected = Buffer.from(expectedToken, 'utf8');

  return async function authorizePairing(actor) {
    if (!actor || typeof actor !== 'object' || typeof actor.pairingToken !== 'string') {
      return false;
    }

    const supplied = Buffer.from(actor.pairingToken, 'utf8');
    if (supplied.length !== expected.length) return false;
    return crypto.timingSafeEqual(supplied, expected);
  };
}

module.exports = { createPairingAuthorizer, MIN_TOKEN_BYTES };
