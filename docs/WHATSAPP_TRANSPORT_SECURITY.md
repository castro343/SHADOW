# SHADOW WhatsApp Transport & Pairing Security

The first Baileys transport adapter now exists in `lib/whatsapp-transport.js`. It is tested with mocked socket and MongoDB boundaries. It is not started by `index.js` and has not connected to a real WhatsApp account.

## Current transport behavior

- Dynamically imports the installed `@whiskeysockets/baileys` package.
- Creates one socket with the encrypted MongoDB auth state.
- Uses `markOnlineOnConnect: false`, `syncFullHistory: false`, and `printQRInTerminal: false`.
- Persists credential updates and Signal-key mutations.
- Exposes normalized inbound message data, filtering self-sent messages and broadcast/status traffic.
- Deduplicates recent inbound message IDs in memory.
- Does not expose the raw socket to command plugins.
- Does not auto-request pairing codes.
- Closes the socket and MongoDB client through an explicit close method.

## Pairing boundary

Pairing requires an explicit call to `transport.requestPairingCode(actor, phoneNumber)`. The transport refuses to proceed unless an injected `authorizePairing(actor)` callback approves the actor. The authorization callback must be implemented by a trusted owner-authentication layer; do not use an unverified HTTP request field or a chat message's claimed sender as proof of ownership.

The phone number must include the country calling code and contain digits only. For Kenya, the format begins with `254`, not the domestic leading `0`.

Never log phone numbers, pairing codes, QR payloads, auth credentials, or Signal keys.

## Session persistence

The transport uses the AES-256-GCM MongoDB auth-state adapter in `lib/mongo-auth-state.js`. Both credentials and Signal key-store mutations are persisted. The encryption key is supplied through `SHADOW_SESSION_ENCRYPTION_KEY`, separately from the MongoDB connection string.

Required private environment:
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `MONGODB_COLLECTION` (optional; defaults to `shadow_auth_state`)
- `SHADOW_SESSION_ENCRYPTION_KEY` (32 bytes, hex or base64)
- `SHADOW_SESSION_ID` (logical account identifier)

The MongoDB collection uses a unique compound index on `{ sessionId: 1, kind: 1, key: 1 }`.

## Remaining integration work

Before production connection:
1. Implement and review the trusted owner-authentication callback.
2. Add bounded reconnect/backoff and explicit logout handling.
3. Add integration tests against a disposable MongoDB database.
4. Verify the exact installed Baileys package exports and auth-state behavior in Node.js 24.
5. Add a safe shutdown hook and test interrupted writes/process restarts.
6. Add transport-level sender and group-admin verification before command dispatch.
7. Keep the startup guard in `index.js` until the above gates pass.

## Explicitly excluded

No remote bootstrapper, automatic code updater, third-party pairing relay, SMS-bomber plugin, destructive Heroku token commands, unrestricted URL fetcher, or unreviewed upstream plugin may be re-enabled.
