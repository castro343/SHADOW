'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createWhatsAppTransport, normalizeMessage, safeConnectionUpdate } = require('../lib/whatsapp-transport');

const BufferJSON = {
  replacer: (_key, value) => Buffer.isBuffer(value)
    ? { type: 'Buffer', data: [...value] }
    : value,
  reviver: (_key, value) => value && value.type === 'Buffer' && Array.isArray(value.data)
    ? Buffer.from(value.data)
    : value
};

function createMongoMock() {
  const records = new Map();
  const idFor = f => [f.sessionId, f.kind, f.key].join('|');
  const collection = {
    async createIndex() {},
    async findOne(filter) { return records.get(idFor(filter)) || null; },
    async updateOne(filter, update) { records.set(idFor(filter), { ...update.$set }); },
    async deleteMany(filter) { records.delete(idFor(filter)); }
  };
  let closed = false;
  class FakeMongoClient {
    async connect() {}
    db() {
      return {
        async command() {},
        collection() { return collection; }
      };
    }
    async close() { closed = true; }
  }
  return { FakeMongoClient, collection, records, wasClosed: () => closed };
}

function createBaileysMock() {
  const ev = new EventEmitter();
  const socket = {
    ev,
    end() { ev.emit('close'); },
    async requestPairingCode(number) { return 'TEST-CODE-' + number.slice(-2); }
  };
  const calls = [];
  return {
    calls,
    socket,
    baileys: {
      default(options) {
        calls.push(options);
        return socket;
      },
      initAuthCreds: () => ({ registered: false }),
      BufferJSON,
      proto: {},
      makeCacheableSignalKeyStore(keys) { return keys; }
    }
  };
}

const env = {
  MONGODB_URI: 'mongodb+srv://user:password@example.mongodb.net/',
  MONGODB_DATABASE: 'shadow',
  SHADOW_SESSION_ENCRYPTION_KEY: 'b'.repeat(64),
  SHADOW_SESSION_ID: 'primary'
};

test('creates a transport with secure socket defaults and no QR output', async () => {
  const mongo = createMongoMock();
  const baileys = createBaileysMock();
  const transport = await createWhatsAppTransport({
    env,
    MongoClient: mongo.FakeMongoClient,
    logger: {},
    baileys: baileys.baileys,
    authorizePairing: async actor => actor === 'owner'
  });

  assert.equal(baileys.calls.length, 1);
  assert.equal(baileys.calls[0].printQRInTerminal, false);
  assert.equal(baileys.calls[0].markOnlineOnConnect, false);
  assert.equal(baileys.calls[0].syncFullHistory, false);
  await transport.close();
  assert.equal(mongo.wasClosed(), true);
});

test('pairing requires owner authorization and an unregistered auth state', async () => {
  const mongo = createMongoMock();
  const baileys = createBaileysMock();
  const transport = await createWhatsAppTransport({
    env,
    MongoClient: mongo.FakeMongoClient,
    logger: {},
    baileys: baileys.baileys,
    authorizePairing: async actor => actor === 'owner'
  });

  await assert.rejects(() => transport.requestPairingCode('guest', '254712345678'), /authorized SHADOW owner/);
  assert.equal(await transport.requestPairingCode('owner', '254712345678'), 'TEST-CODE-78');
  await transport.close();
});

test('normalizes inbound messages and filters self/status traffic', () => {
  const base = {
    key: { id: 'm1', remoteJid: '12345@s.whatsapp.net', fromMe: false },
    pushName: 'Test',
    messageTimestamp: 123,
    message: { conversation: 'hello' }
  };
  assert.equal(normalizeMessage(base).chatId, '12345@s.whatsapp.net');
  assert.equal(normalizeMessage({ ...base, key: { ...base.key, fromMe: true } }), null);
  assert.equal(normalizeMessage({ ...base, key: { ...base.key, remoteJid: 'status@broadcast' } }), null);
  assert.equal(normalizeMessage({ ...base, message: null }), null);
});

test('does not expose QR contents in connection callbacks and deduplicates messages', async () => {
  const mongo = createMongoMock();
  const baileys = createBaileysMock();
  const updates = [];
  const messages = [];
  const transport = await createWhatsAppTransport({
    env,
    MongoClient: mongo.FakeMongoClient,
    logger: {},
    baileys: baileys.baileys,
    authorizePairing: async () => false,
    onConnectionUpdate: update => updates.push(update),
    onMessage: async message => messages.push(message)
  });

  baileys.socket.ev.emit('connection.update', { connection: 'open', qr: 'SENSITIVE-QR' });
  const msg = {
    key: { id: 'same-id', remoteJid: '12345@s.whatsapp.net', fromMe: false },
    message: { conversation: 'hello' }
  };
  baileys.socket.ev.emit('messages.upsert', { type: 'notify', messages: [msg, msg] });
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(updates, [{ connection: 'open', hasQr: true, isNewLogin: false, receivedPendingNotifications: false, lastDisconnectStatusCode: null }]);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].message.conversation, 'hello');
  await transport.close();
});

test('closes MongoDB if socket creation fails', async () => {
  const mongo = createMongoMock();
  const brokenBaileys = {
    ...createBaileysMock().baileys,
    default() { throw new Error('socket failed'); }
  };
  await assert.rejects(() => createWhatsAppTransport({
    env,
    MongoClient: mongo.FakeMongoClient,
    logger: {},
    baileys: brokenBaileys
  }), /socket failed/);
  assert.equal(mongo.wasClosed(), true);
});

test('sanitizes connection updates', () => {
  assert.deepEqual(
    safeConnectionUpdate({ connection: 'close', qr: 'do-not-return', isNewLogin: true, lastDisconnect: { error: { output: { statusCode: 401 } } } }),
    { connection: 'close', hasQr: true, isNewLogin: true, receivedPendingNotifications: false, lastDisconnectStatusCode: 401 }
  );
});
