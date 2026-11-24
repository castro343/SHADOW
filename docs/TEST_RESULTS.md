# SHADOW Runtime Foundation — Test Results

**Date:** 2026-11-24  
**Runtime:** Node.js 24  
**Unit-test command:** `npm test` (`node --test`)

## Latest verified GitHub Actions run

- **Unit tests:** 37 passed, 0 failed, 0 skipped.
- **Dependency API check:** passed; the workflow installed the pinned Baileys `7.0.0-rc14` and MongoDB `7.9.1` packages in an isolated temporary directory and verified the required exports.
- **SHADOW CI run:** https://github.com/castro343/SHADOW/actions/runs/45384805087
- **Legacy unit-test workflow:** https://github.com/castro343/SHADOW/actions/runs/45384805103
- **Verified commit:** `59643c77ef45c4f22993317c194bf4dd672e6286`

## Coverage

1. Command registration, aliases, duplicate rejection, and permission enforcement.
2. Explicit plugin allowlisting and core ping/menu registration.
3. Pairing number validation and refusal to pair an already-registered session.
4. AES-256-GCM encryption, authentication-tag tamper detection, and credential restoration.
5. MongoDB auth-state persistence for Signal keys, deletion, session isolation, missing-key semantics, app-state sync key conversion, and serialized writes.
6. MongoDB configuration validation, connection/ping flow, and safe cleanup after connection failure.
7. Baileys transport setup, safe socket defaults, owner-authorization gate for pairing, inbound-message normalization, status/self filtering, message deduplication, database cleanup, and sanitized registration callbacks.
8. Owner-token minimum length, exact token authorization, malformed actor rejection, and non-string credential rejection.
9. Reconnect behavior: ordinary close retry, logout stop, bounded exponential backoff, shutdown, and duplicate close-event protection.

## Scope limitations

The unit tests use mocked MongoDB collections/clients and mocked Baileys socket boundaries. The package API workflow verifies real npm package installation and required exports, but it does not create a WhatsApp connection.

Not yet tested:
- Live MongoDB Atlas connectivity using a dedicated disposable database.
- Real WhatsApp pairing and successful session persistence.
- Reconnection behavior against live Baileys socket disconnects.
- Process restart and recovery using an integration database.
- Render deployment, end-to-end message delivery, and authenticated sender/group-admin metadata.

The safe startup guard remains in place. Passing unit tests and package export checks do not authorize production deployment.
