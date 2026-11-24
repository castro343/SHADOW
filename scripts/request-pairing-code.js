'use strict';

require('dotenv').config({ path: process.env.SHADOW_ENV_FILE || 'config.env' });

const { createWhatsAppTransport } = require('../lib/whatsapp-transport');
const { createPairingAuthorizer } = require('../lib/owner-auth');
const { validatePairingNumber } = require('../lib/pairing');

async function main() {
  const phoneNumber = process.argv[2];
  validatePairingNumber(phoneNumber);

  const expectedToken = process.env.SHADOW_PAIRING_TOKEN;
  const requestToken = process.env.SHADOW_PAIRING_REQUEST_TOKEN;
  if (!expectedToken || !requestToken) {
    throw new Error('Set SHADOW_PAIRING_TOKEN and SHADOW_PAIRING_REQUEST_TOKEN in the private runtime environment.');
  }

  const authorizePairing = createPairingAuthorizer(expectedToken);
  const transport = await createWhatsAppTransport({ authorizePairing });

  try {
    const code = await transport.requestPairingCode({ pairingToken: requestToken }, phoneNumber);
    process.stdout.write('SHADOW pairing code: ' + code + '\n');
    process.stdout.write('Enter this code in WhatsApp on the phone number you are pairing.\n');
  } finally {
    await transport.close();
  }
}

main().catch(error => {
  process.stderr.write('SHADOW pairing request failed: ' + error.message + '\n');
  process.exitCode = 1;
});
