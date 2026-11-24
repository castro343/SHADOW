# SHADOW Runtime Foundation — Test Results

**Date:** 2026-11-24  
**Command:** `npm test` (`node --test`)  
**Primary CI runtime:** Node.js 24  
**Initial local runtime:** Node.js v22.16.0

## Latest Node.js 24 CI result

- Tests: 22
- Passed: 22
- Failed: 0
- Skipped: 0
- Status: **Passed**
- Workflow run: https://github.com/castro343/SHADOW/actions/runs/45383205226
- Tested commit: `99f8adea8cc9a9a29db3e2c379afdbca4606b101`

## Coverage

1. Command registration, aliases, duplicate rejection, and permission enforcement.
2. Explicit plugin allowlisting and core ping/menu registration.
3. Pairing number validation and refusal to pair an already-registered session.
4. AES-256-GCM encryption, authentication-tag tamper detection, and credential restoration.
5. MongoDB auth-state persistence for Signal keys, deletion, session isolation, missing-key semantics, app-state sync key conversion, and serialized writes.
6. MongoDB configuration validation, connection/ping flow, and safe cleanup after connection failure.

## Scope limitations

These are unit tests with mocked MongoDB collections and mocked socket-facing boundaries. They do not test a live Atlas database, a live WhatsApp connection, real pairing, Render deployment, process restarts against production data, or end-to-end message delivery. The safe startup guard remains in place until those integration and security checks are completed.
