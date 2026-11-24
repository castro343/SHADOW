'use strict';

const PHONE_NUMBER_PATTERN = /^[1-9][0-9]{7,14}$/;

function validatePairingNumber(value) {
  if (typeof value !== 'string' || !PHONE_NUMBER_PATTERN.test(value)) {
    throw new TypeError('Pairing number must be 8–15 digits, include the country code, and contain no +, spaces, or punctuation.');
  }
  return value;
}

/**
 * Request a pairing code only when the caller supplies the auth credentials
 * used to create this socket. Baileys sockets do not expose authState publicly.
 */
async function requestPairingCode(socket, phoneNumber, credentials) {
  const number = validatePairingNumber(phoneNumber);

  if (!socket || typeof socket.requestPairingCode !== 'function') {
    throw new TypeError('A valid WhatsApp socket is required.');
  }
  if (!credentials || credentials.registered !== false) {
    throw new Error('Pairing code can only be requested for an unregistered session.');
  }

  return socket.requestPairingCode(number);
}

module.exports = { validatePairingNumber, requestPairingCode };
