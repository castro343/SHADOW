# Encrypted MongoDB Auth-State Adapter

This module stores Baileys credentials and Signal keys in MongoDB, encrypted at rest by the application before writes.

## Data protection

- Each credential record and Signal key record is encrypted independently with AES-256-GCM.
- Every write uses a fresh 96-bit IV and stores the authentication tag.
- The encryption key is supplied at runtime through SHADOW_SESSION_ENCRYPTION_KEY; it must be 32 bytes, encoded as 64 hexadecimal characters or base64.
- Keep the encryption key separate from MongoDB credentials and never commit it to Git or store it in the same database as the encrypted records.
- Ciphertext is authenticated; modified or corrupted records fail decryption.

## Actual SHADOW Atlas layout

The approved Atlas target is Project 0, cluster Cluster0. A dedicated database named shadow and collection shadow_auth_state have been created. The collection has a unique compound index on { sessionId: 1, kind: 1, key: 1 }.

A dedicated Atlas database user named shadow_runtime has been created with readWrite access only to the shadow database. It does not have access to the existing castro_md database. Its generated password must be rotated/reissued and stored privately before the application can connect; it is not stored in this repository.

## Runtime configuration

- MONGODB_URI — Cluster0 SRV connection string with the dedicated SHADOW database user credentials.
- MONGODB_DATABASE — shadow.
- MONGODB_COLLECTION — shadow_auth_state.
- SHADOW_SESSION_ID — primary (or another isolated identifier for another owned linked device).
- SHADOW_SESSION_ENCRYPTION_KEY — independent 32-byte encryption key, stored only in a private host secret manager.

## Baileys integration contract

The transport passes Baileys initAuthCreds and BufferJSON into createMongoAuthState, supplies the returned state as the socket auth option, and persists creds.update events. Signal-key mutations are persisted as well. Missing keys are returned as null, and app-state sync keys are converted through the supplied Baileys proto helper. Writes to the same credential/key record are serialized to avoid out-of-order updates.

The MongoDB client lifecycle belongs to the transport process. Connect once, create/verify the unique index, construct the auth state, and close the client after sockets stop and pending writes finish.

## Remaining verification

The Atlas collection and index have been provisioned, but the Node.js application's live connection, encrypted write/read round trip, WhatsApp pairing, and restart recovery have not yet been exercised. Never log phone numbers, pairing codes, credentials, Signal keys, connection strings, or encryption material.
