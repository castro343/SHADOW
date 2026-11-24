# Encrypted MongoDB Auth-State Adapter

This module is a persistence layer only. It does not connect to WhatsApp, create a Baileys socket, or initiate pairing. The MongoDB connection helper uses the official Node.js driver (currently pinned by the package range to 7.9.1 or compatible patch/minor releases).

## Data protection

- Each credential record and Signal key record is encrypted independently with AES-256-GCM.
- Every write uses a fresh 96-bit IV and stores the authentication tag.
- The encryption key is supplied at runtime through `SHADOW_SESSION_ENCRYPTION_KEY`; it must be 32 bytes, encoded as 64 hexadecimal characters or base64.
- The encryption key must be kept separately from MongoDB credentials and must never be committed to Git or stored in the same database as the encrypted records.
- Ciphertext is authenticated; modified or corrupted records fail decryption.

## MongoDB layout

Use a dedicated collection such as `shadow_auth_state`. Each document belongs to one `sessionId` and contains one encrypted credential or Signal-key value. The adapter creates a unique compound index on `{ sessionId: 1, kind: 1, key: 1 }` when initialized. The `lib/mongo-connection.js` helper validates private settings, connects, pings the selected database, and returns the scoped collection; it closes failed clients without printing connection details.

Suggested environment variables:
- `MONGODB_URI` — Atlas connection string, stored as a private Render environment variable.
- `MONGODB_DATABASE` — dedicated database name.
- `SHADOW_SESSION_ENCRYPTION_KEY` — independent 32-byte encryption key, stored as a private Render environment variable.
- `SHADOW_SESSION_ID` — logical account identifier, not a secret.

## Baileys integration contract

Pass Baileys' `initAuthCreds` and `BufferJSON` into `createMongoAuthState`, then supply the returned `state` as the socket's `auth` option and register `saveCreds` on `creds.update`. The adapter implements Signal-key `get` and `set` so key mutations are persisted as well as credential updates. Missing keys are returned as `null`, and app-state sync keys are converted through the supplied Baileys `proto` helper. Writes to the same credential/key record are serialized to avoid out-of-order updates.

The MongoDB client lifecycle belongs to the transport process. Connect once, create the unique index, construct the auth state, and close the client after sockets stop and pending writes finish.

## Not production-enabled yet

The current adapter deliberately does not instantiate a MongoDB client or read environment variables. Before enabling it, add integration tests against a disposable database, verify Baileys v7 auth-state compatibility, add write serialization/retry handling, and test process interruption during key updates. Never log phone numbers, pairing codes, credentials, Signal keys, connection strings, or encryption material.
