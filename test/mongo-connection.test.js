'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { connectMongoAuthCollection, validateMongoConfig } = require('../lib/mongo-connection');

const valid = {
  uri: 'mongodb+srv://user:password@example.mongodb.net/?retryWrites=true&w=majority',
  databaseName: 'shadow',
  collectionName: 'shadow_auth_state'
};

test('validates MongoDB URI, database, and collection configuration', () => {
  assert.doesNotThrow(() => validateMongoConfig(valid));
  assert.throws(() => validateMongoConfig({ ...valid, uri: 'https://example.com' }), /MONGODB_URI/);
  assert.throws(() => validateMongoConfig({ ...valid, databaseName: '../bad' }), /MONGODB_DATABASE/);
  assert.throws(() => validateMongoConfig({ ...valid, collectionName: 'bad/name' }), /collection name/);
});

test('connects, pings, and returns a scoped auth collection', async () => {
  const events = [];
  const collection = { name: 'shadow_auth_state' };
  class FakeMongoClient {
    constructor(uri, options) {
      events.push(['construct', uri, options.appName]);
    }
    async connect() { events.push(['connect']); }
    db(name) {
      return {
        async command(command) { events.push(['ping', name, command.ping]); },
        collection(name) { events.push(['collection', name]); return collection; }
      };
    }
    async close() { events.push(['close']); }
  }

  const result = await connectMongoAuthCollection({ ...valid, MongoClient: FakeMongoClient });
  assert.equal(result.collection, collection);
  await result.close();
  assert.deepEqual(events.map(event => event[0]), ['construct', 'connect', 'ping', 'collection', 'close']);
});

test('closes a failed connection without exposing connection details', async () => {
  let closed = false;
  class BrokenMongoClient {
    async connect() { throw new Error('secret connection string should not leak'); }
    async close() { closed = true; }
  }

  await assert.rejects(
    () => connectMongoAuthCollection({ ...valid, MongoClient: BrokenMongoClient }),
    error => !error.message.includes('secret connection string')
  );
  assert.equal(closed, true);
});
