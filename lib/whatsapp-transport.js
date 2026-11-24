'use strict';

const { connectMongoAuthCollection } = require('./mongo-connection');
const { createMongoAuthState } = require('./mongo-auth-state');
const { requestPairingCode: requestCode } = require('./pairing');

const DEFAULT_COLLECTION = 'shadow_auth_state';
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function safeConnectionUpdate(update = {}) {
  return {
    connection: update.connection || null,
    hasQr: Boolean(update.qr),
    isNewLogin: Boolean(update.isNewLogin),
    receivedPendingNotifications: Boolean(update.receivedPendingNotifications),
    lastDisconnectStatusCode: Number.isInteger(update.lastDisconnect?.error?.output?.statusCode)
      ? update.lastDisconnect.error.output.statusCode
      : null
  };
}

function normalizeMessage(message) {
  if (!message || !message.key || !message.message) return null;
  if (message.key.fromMe === true) return null;

  const chatId = message.key.remoteJid;
  if (typeof chatId !== 'string' || chatId === 'status@broadcast' || chatId.endsWith('@broadcast')) {
    return null;
  }

  return {
    id: typeof message.key.id === 'string' ? message.key.id : null,
    chatId,
    senderJid: message.key.participant || chatId,
    isGroup: chatId.endsWith('@g.us'),
    pushName: typeof message.pushName === 'string' ? message.pushName : '',
    timestamp: message.messageTimestamp || null,
    message: message.message
  };
}

function validateTransportEnvironment(env) {
  if (!env || typeof env !== 'object') throw new TypeError('Runtime environment is required.');
  if (!env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!env.MONGODB_DATABASE) throw new Error('MONGODB_DATABASE is required.');
  if (!env.SHADOW_SESSION_ENCRYPTION_KEY) throw new Error('SHADOW_SESSION_ENCRYPTION_KEY is required.');
  if (!SESSION_ID_PATTERN.test(env.SHADOW_SESSION_ID || '')) {
    throw new Error('SHADOW_SESSION_ID must be 1–64 letters, numbers, underscores, or hyphens.');
  }
}

async function loadBaileys() {
  return import('@whiskeysockets/baileys');
}

/**
 * Creates one WhatsApp transport using encrypted MongoDB auth state.
 * Pairing is never automatic: the caller must supply an authorization callback
 * and explicitly call requestPairingCode(actor, phoneNumber).
 */
async function createWhatsAppTransport({
  env = process.env,
  baileys: injectedBaileys,
  MongoClient,
  logger,
  authorizePairing,
  onConnectionUpdate = () => {},
  onCredentialsUpdate = () => {},
  onMessage = async () => {},
  onError = () => {}
} = {}) {
  validateTransportEnvironment(env);

  const baileys = injectedBaileys || await loadBaileys();
  const makeWASocket = baileys.default || baileys.makeWASocket;
  const { initAuthCreds, BufferJSON, proto, makeCacheableSignalKeyStore } = baileys;

  if (typeof makeWASocket !== 'function' ||
      typeof initAuthCreds !== 'function' ||
      !BufferJSON ||
      typeof makeCacheableSignalKeyStore !== 'function') {
    throw new Error('The installed Baileys package does not expose the required authentication and socket APIs.');
  }

  const mongo = await connectMongoAuthCollection({
    MongoClient,
    uri: env.MONGODB_URI,
    databaseName: env.MONGODB_DATABASE,
    collectionName: env.MONGODB_COLLECTION || DEFAULT_COLLECTION
  });

  let socket;
  let closed = false;
  let pendingCredSave = Promise.resolve();
  const seenMessageIds = new Set();

  try {
    const auth = await createMongoAuthState({
      collection: mongo.collection,
      sessionId: env.SHADOW_SESSION_ID,
      encryptionKey: env.SHADOW_SESSION_ENCRYPTION_KEY,
      initAuthCreds,
      BufferJSON,
      proto
    });

    const activeLogger = logger || require('pino')({ level: 'silent' });
    socket = makeWASocket({
      auth: {
        creds: auth.state.creds,
        keys: makeCacheableSignalKeyStore(auth.state.keys, activeLogger)
      },
      logger: activeLogger,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    if (!socket || !socket.ev || typeof socket.ev.on !== 'function') {
      throw new Error('Baileys did not return a valid event socket.');
    }

    socket.ev.on('creds.update', () => {
      pendingCredSave = pendingCredSave
        .then(async () => {
          await auth.saveCreds();
          try {
            onCredentialsUpdate({ registered: Boolean(auth.state.creds.registered) });
          } catch {
            onError({ code: 'CREDENTIALS_CALLBACK_FAILED', message: 'SHADOW credentials callback failed.' });
          }
        })
        .catch(() => {
          onError({ code: 'AUTH_PERSISTENCE_FAILED', message: 'SHADOW could not persist updated authentication data.' });
        });
    });

    socket.ev.on('connection.update', update => {
      try {
        onConnectionUpdate(safeConnectionUpdate(update));
      } catch {
        onError({ code: 'CONNECTION_CALLBACK_FAILED', message: 'SHADOW connection callback failed.' });
      }
    });

    socket.ev.on('messages.upsert', event => {
      if (!event || event.type !== 'notify' || !Array.isArray(event.messages)) return;

      for (const rawMessage of event.messages) {
        const normalized = normalizeMessage(rawMessage);
        if (!normalized) continue;
        if (normalized.id && seenMessageIds.has(normalized.id)) continue;

        if (normalized.id) {
          seenMessageIds.add(normalized.id);
          if (seenMessageIds.size > 5000) {
            const oldest = seenMessageIds.values().next().value;
            seenMessageIds.delete(oldest);
          }
        }

        Promise.resolve(onMessage(normalized)).catch(() => {
          onError({ code: 'MESSAGE_CALLBACK_FAILED', message: 'SHADOW message handler failed.' });
        });
      }
    });

    return {
      async requestPairingCode(actor, phoneNumber) {
        if (typeof authorizePairing !== 'function' || !(await authorizePairing(actor))) {
          throw new Error('Pairing is restricted to an authorized SHADOW owner.');
        }
        return requestCode(socket, phoneNumber, auth.state.creds);
      },

      async close() {
        if (closed) return;
        closed = true;
        try {
          await pendingCredSave;
          await auth.saveCreds();
        } finally {
          try {
            if (typeof socket.end === 'function') socket.end();
          } finally {
            await mongo.close();
          }
        }
      }
    };
  } catch (error) {
    if (socket && typeof socket.end === 'function') socket.end();
    await mongo.close();
    throw error;
  }
}

module.exports = {
  createWhatsAppTransport,
  normalizeMessage,
  safeConnectionUpdate,
  validateTransportEnvironment
};
