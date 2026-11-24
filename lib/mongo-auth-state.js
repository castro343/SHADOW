'use strict';

const crypto = require('node:crypto');

const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const KEY_TYPE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function decodeEncryptionKey(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('A 32-byte SHADOW_SESSION_ENCRYPTION_KEY is required.');
  }

  let key;
  if (/^[a-fA-F0-9]{64}$/.test(value)) {
    key = Buffer.from(value, 'hex');
  } else {
    key = Buffer.from(value, 'base64');
  }

  if (key.length !== 32) {
    throw new TypeError('Session encryption key must decode to exactly 32 bytes (64 hex characters or base64).');
  }
  return key;
}

function encryptJson(value, key, BufferJSON) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(value, BufferJSON.replacer), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  return {
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64')
  };
}

function decryptJson(record, key, BufferJSON) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(record.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, 'base64')),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString('utf8'), BufferJSON.reviver);
}

function validateSessionId(sessionId) {
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
    throw new TypeError('Session ID must be 1–64 letters, numbers, underscores, or hyphens.');
  }
}

function validateKeyType(type) {
  if (typeof type !== 'string' || !KEY_TYPE_PATTERN.test(type)) {
    throw new TypeError('Invalid Signal key type.');
  }
}

/**
 * Creates a Baileys-compatible auth state backed by a MongoDB collection.
 *
 * The caller supplies the already-connected collection, Baileys initAuthCreds,
 * and Baileys BufferJSON. This keeps connection lifecycle and secrets outside
 * this module and makes the persistence behavior testable without Atlas.
 */
async function createMongoAuthState({
  collection,
  sessionId,
  encryptionKey,
  initAuthCreds,
  BufferJSON
}) {
  validateSessionId(sessionId);

  if (!collection || typeof collection.findOne !== 'function' ||
      typeof collection.updateOne !== 'function' ||
      typeof collection.deleteMany !== 'function') {
    throw new TypeError('A valid MongoDB collection is required.');
  }
  if (typeof initAuthCreds !== 'function') {
    throw new TypeError('Baileys initAuthCreds is required.');
  }
  if (!BufferJSON || typeof BufferJSON.replacer !== 'function' ||
      typeof BufferJSON.reviver !== 'function') {
    throw new TypeError('Baileys BufferJSON is required.');
  }

  const key = decodeEncryptionKey(encryptionKey);
  const identity = { sessionId };

  async function read(kind, itemKey) {
    const record = await collection.findOne({ ...identity, kind, key: itemKey });
    return record ? decryptJson(record, key, BufferJSON) : null;
  }

  async function write(kind, itemKey, value) {
    const encrypted = encryptJson(value, key, BufferJSON);
    await collection.updateOne(
      { ...identity, kind, key: itemKey },
      {
        $set: {
          ...identity,
          kind,
          key: itemKey,
          ...encrypted,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  const credentialRecord = await read('creds', 'creds');
  const creds = credentialRecord || initAuthCreds();

  const state = {
    creds,
    keys: {
      async get(type, ids) {
        validateKeyType(type);
        if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id || id.length > 256)) {
          throw new TypeError('Signal key IDs must be non-empty strings up to 256 characters.');
        }

        const entries = await Promise.all(ids.map(async id => [id, await read('signal', type + ':' + id)]));
        return Object.fromEntries(entries.filter(([, value]) => value !== null));
      },

      async set(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new TypeError('Signal key updates must be an object.');
        }

        for (const [type, entries] of Object.entries(data)) {
          validateKeyType(type);
          if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
            throw new TypeError('Signal key entries must be an object.');
          }

          for (const [id, value] of Object.entries(entries)) {
            if (!id || id.length > 256) throw new TypeError('Invalid Signal key ID.');
            const storageKey = type + ':' + id;
            if (value === null || value === undefined) {
              await collection.deleteMany({ ...identity, kind: 'signal', key: storageKey });
            } else {
              await write('signal', storageKey, value);
            }
          }
        }
      }
    }
  };

  return {
    state,
    async saveCreds() {
      await write('creds', 'creds', state.creds);
    }
  };
}

module.exports = {
  createMongoAuthState,
  decodeEncryptionKey,
  decryptJson,
  encryptJson,
  validateSessionId
};
