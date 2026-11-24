# Owner Authorization and Reconnect Policy

## Owner pairing authorization

`lib/owner-auth.js` exports `createPairingAuthorizer(expectedToken)`. It rejects missing/short secrets and compares equal-length UTF-8 token buffers with Node's `crypto.timingSafeEqual`.

Operational requirements:

- Generate `SHADOW_PAIRING_TOKEN` from a cryptographically secure random source (at least 32 random bytes).
- Store it only as a host secret/environment variable; never commit it, print it, or send it through WhatsApp.
- A trusted local CLI or authenticated owner-only control endpoint must construct the actor object `{ pairingToken }`.
- Never construct that actor from an inbound WhatsApp message, a command argument, or a user-controlled request body without authentication.
- The authorizer is not an HTTP server, login system, or complete owner identity system. No control endpoint is enabled by this change.

Example secret generation (run locally in a trusted shell):

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Reconnect supervisor

`lib/transport-supervisor.js` accepts an injected transport factory and callbacks. It:

- closes the previous transport before retrying;
- retries ordinary failures with exponential delays capped by `maxDelayMs`;
- stops after `maxRetries` attempts;
- stops immediately when the sanitized Baileys disconnect status is 401 (logged out);
- does not automatically request a new pairing code.

The default retry schedule starts at 1 second and doubles up to 30 seconds. Tests inject a no-wait sleep function; no live WhatsApp connection is created.

## Remaining integration work

- Implement a trusted owner-control boundary and pass its authorizer into the transport.
- Verify the exact Baileys disconnect status behavior against the pinned package at runtime.
- Exercise reconnect and logout handling against a disposable test account only after explicit authorization.
- Keep the safe `index.js` startup guard until owner control, Atlas integration, runtime dependency validation, and sender/group-admin identity checks are complete.

## Running the local pairing utility

The repository includes `scripts/request-pairing-code.js`, exposed as `npm run pair`. It is deliberately a local command rather than a public web endpoint.

1. Configure all MongoDB and encryption settings in a private `config.env` or environment manager.
2. Generate `SHADOW_PAIRING_TOKEN` as a private random secret of at least 32 bytes.
3. Supply `SHADOW_PAIRING_REQUEST_TOKEN` independently for the local invocation. Do not store either token in Git or send them in WhatsApp.
4. Run `npm run pair -- 2547XXXXXXXX` with the target number in international digits-only format.
5. The utility waits for the Baileys connection to open before requesting the pairing code, then closes the transport.

The pairing utility has not yet been tested with a live WhatsApp account. Use only a disposable test session and a dedicated test database after the dependency API check passes. Never point it at another bot's session database.
