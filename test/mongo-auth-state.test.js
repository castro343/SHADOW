'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMongoAuthState,
  decodeEncryptionKey,
  decryptJson,
  encryptJson
} = require('../lib/mongo-auth-state');

const BufferJSON = {
  replacer: (_key, value) => Buffer.isBuffer(value)
    ? { type: 'Buffer', data: [...value] }
    : value,
  reviver: (_key, value) => value && value.type === 'Buffer' && Array.isArray(value.data)
    ? Buffer.from(value.data)
    : value
};

function makeCollection() {
  const records = new Map();
  const idFor = filter => [filter.sessionId, filter.kind, filter.key].join('|');
  return {
    records,
    async findOne(filter) {
      return records.get(idFor(filter)) || null;
    },
    async updateOne(filter, update) {
      records.set(idFor(filter), { ...update.$set });
      return { acknowledged: true };
    },
    async deleteMany(filter) {
      records.delete(idFor(filter));
      return { acknowledged: true };
    }
  };
}

const encryptionKey = 'a'.repeat(64);

test('accepts only a 32-byte encryption key', () => {
  assert.equal(decodeEncryptionKey(encryptionKey).length, 32);
  assert.throws(() => decodeEncryptionKey('too-short'), /exactly 32 bytes/);
});

test('encrypts data and rejects ciphertext tampering', () => {
  const key = decodeEncryptionKey(encryptionKey);
  const record = encryptJson({ secret: 'value' }, key, BufferJSON);
  assert.deepEqual(decryptJson(record, key, BufferJSON), { secret: 'value' });
  record.ciphertext = Buffer.from('tampered').toString('base64');
  assert.throws(() => decryptJson(record, key, BufferJSON));
});

test('creates credentials and persists credential updates encrypted', async () => {
  const collection = makeCollection();
  let initCount = 0;
  const auth = await createMongoAuthState({
    collection,
    sessionId: 'primary',
    encryptionKey,
    initAuthCreds: () => {
      initCount += 1;
      return { registered: false, noiseKey: Buffer.from([1, 2, 3]) };
    },
    BufferJSON
  });

  assert.equal(initCount, 1);
  await auth.saveCreds();
  assert.equal(collection.records.size, 1);
  const stored = [...collection.records.values()][0];
  assert.equal(stored.ciphertext.includes('registered'), false);

  const restored = await createMongoAuthState({
    collection,
    sessionId: 'primary',
    encryptionKey,
    initAuthCreds: () => {
      throw new Error('Should load persisted credentials');
    },
    BufferJSON
  });
  assert.equal(restored.state.creds.registered, false);
  assert.deepEqual(restored.state.creds.noiseKey, Buffer.from([1, 2, 3]));
});

test('persists, reads, and deletes Signal keys per session', async () => {
  const collection = makeCollection();
  const options = {
    collection,
    sessionId: 'account_a',
    encryptionKey,
    initAuthCreds: () => ({ registered: false }),
    BufferJSON
  };
  const auth = await createMongoAuthState(options);

  await auth.state.keys.set({ session: { abc: { key: Buffer.from([9, 8]) } } });
  const values = await auth.state.keys.get('session', ['abc', 'missing']);
  assert.deepEqual(values.abc.key, Buffer.from([9, 8]));
  assert.equal(values.missing, undefined);

  await auth.state.keys.set({ session: { abc: null } });
  assert.deepEqual(await auth.state.keys.get('session', ['abc']), {});
});

test('isolates sessions and validates IDs and key types', async () => {
  const collection = makeCollection();
  const common = {
    collection,
    encryptionKey,
    initAuthCreds: () => ({ registered: false }),
    BufferJSON
  };
  const a = await createMongoAuthState({ ...common, sessionId: 'account_a' });
  const b = await createMongoAuthState({ ...common, sessionId: 'account_b' });

  await a.state.keys.set({ session: { abc: { secret: 'A' } } });
  assert.deepEqual(await b.state.keys.get('session', ['abc']), {});
  await assert.rejects(() => createMongoAuthState({ ...common, sessionId: '../bad' }), /Session ID/);
  await assert.rejects(() => a.state.keys.get('../bad', ['abc']), /Signal key type/);
});
