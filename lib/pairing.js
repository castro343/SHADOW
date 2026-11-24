'use strict';

const PHONE_NUMBER_PATTERN = /^[1-9][0-9]{7,14}$/;

/**
 * Validate an international phone number for Baileys pairing.
 * Expected format: country code + national number, digits only.
 * Example: 2547XXXXXXXX (do not include +, spaces, or punctuation).
 */
function validatePairingNumber(value) {
  if (typeof value !== 'string' || !PHONE_NUMBER_PATTERN.test(value)) {
    throw new TypeError('Pairing number must be 8–15 digits, include the country code, and contain no +, spaces, or punctuation.');
  }
  return value;
}

/**
 * Request one pairing code from an already-created Baileys socket.
 * The caller is responsible for rate limiting and for securely displaying
 * the code to the account owner. Never log the phone number or code.
 */
async function requestPairingCode(socket, phoneNumber) {
  const number = validatePairingNumber(phoneNumber);

  if (!socket || typeof socket.requestPairingCode !== 'function') {
    throw new TypeError('A valid WhatsApp socket is required.');
  }

  const credentials = socket.authState && socket.authState.creds;
  if (!credentials || credentials.registered !== false) {
    throw new Error('Pairing code can only be requested for an unregistered session.');
  }

  return socket.requestPairingCode(number);
}

module.exports = { validatePairingNumber, requestPairingCode };
