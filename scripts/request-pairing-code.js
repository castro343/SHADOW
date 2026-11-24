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

  let resolveOpen;
  let rejectOpen;
  const connectionReady = new Promise((resolve, reject) => {
    resolveOpen = resolve;
    rejectOpen = reject;
  });
  // Attach a handler immediately; the original promise is still awaited below.
  void connectionReady.catch(() => {});

  let resolveRegistered;
  let rejectRegistered;
  const registrationReady = new Promise((resolve, reject) => {
    resolveRegistered = resolve;
    rejectRegistered = reject;
  });
  void registrationReady.catch(() => {});

  let transport;
  let connectionTimeout;
  let pairingTimeout;

  try {
    const authorizePairing = createPairingAuthorizer(expectedToken);
    transport = await createWhatsAppTransport({
      authorizePairing,
      onConnectionUpdate(update) {
        if (update.connection === 'open') resolveOpen();
        if (update.connection === 'close') {
          rejectOpen(new Error('WhatsApp connection closed before pairing could start.'));
          rejectRegistered(new Error('WhatsApp connection closed before pairing completed.'));
        }
      },
      onCredentialsUpdate(update) {
        if (update.registered) resolveRegistered();
      }
    });

    connectionTimeout = setTimeout(
      () => rejectOpen(new Error('Timed out waiting for WhatsApp connection.')),
      60000
    );
    await connectionReady;
    clearTimeout(connectionTimeout);
    connectionTimeout = null;

    const code = await transport.requestPairingCode({ pairingToken: requestToken }, phoneNumber);
    process.stdout.write('SHADOW pairing code: ' + code + '\n');
    process.stdout.write('Enter this code in WhatsApp on the target phone. Keep this process running.\n');

    pairingTimeout = setTimeout(
      () => rejectRegistered(new Error('Pairing was not completed within three minutes.')),
      180000
    );
    await registrationReady;
    process.stdout.write('SHADOW session registration confirmed and saved securely.\n');
  } finally {
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (pairingTimeout) clearTimeout(pairingTimeout);
    if (transport) await transport.close();
  }
}

main().catch(error => {
  process.stderr.write('SHADOW pairing request failed: ' + error.message + '\n');
  process.exitCode = 1;
});
