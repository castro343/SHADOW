'use strict';

const DATABASE_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,63}$/;
const COLLECTION_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,63}$/;

function validateMongoConfig({ uri, databaseName, collectionName }) {
  if (typeof uri !== 'string' || !/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new TypeError('MONGODB_URI must be a valid mongodb:// or mongodb+srv:// connection string.');
  }
  if (typeof databaseName !== 'string' || !DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new TypeError('MONGODB_DATABASE must be 1–63 letters, numbers, underscores, or hyphens.');
  }
  if (typeof collectionName !== 'string' || !COLLECTION_NAME_PATTERN.test(collectionName)) {
    throw new TypeError('MongoDB collection name must be 1–63 letters, numbers, underscores, or hyphens.');
  }
}

async function connectMongoAuthCollection({
  MongoClient: MongoClientOverride,
  uri = process.env.MONGODB_URI,
  databaseName = process.env.MONGODB_DATABASE,
  collectionName = 'shadow_auth_state'
} = {}) {
  validateMongoConfig({ uri, databaseName, collectionName });

  let MongoClient = MongoClientOverride;
  if (!MongoClient) {
    ({ MongoClient } = require('mongodb'));
  }
  if (typeof MongoClient !== 'function') {
    throw new TypeError('A valid MongoDB MongoClient constructor is required.');
  }

  const client = new MongoClient(uri, {
    appName: 'SHADOW',
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    retryWrites: true
  });

  try {
    await client.connect();
    const database = client.db(databaseName);
    await database.command({ ping: 1 });
    return {
      client,
      collection: database.collection(collectionName),
      async close() {
        await client.close();
      }
    };
  } catch {
    await client.close().catch(() => {});
    throw new Error('SHADOW could not establish a MongoDB connection. Check the private database settings and network access.');
  }
}

module.exports = { connectMongoAuthCollection, validateMongoConfig };
