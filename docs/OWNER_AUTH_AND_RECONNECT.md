# Owner Authorization and Reconnect Policy

## Owner pairing authorization

lib/owner-auth.js exports createPairingAuthorizer(expectedToken). It rejects missing/short secrets and compares equal-length UTF-8 token buffers with Node's crypto.timingSafeEqual.

Operational requirements:

- Generate SHADOW_PAIRING_TOKEN from a cryptographically secure random source (at least 32 random bytes).
- Store it only as a private environment variable; never commit it, print it, or send it through WhatsApp.
- The local pairing CLI constructs the actor from SHADOW_PAIRING_REQUEST_TOKEN. Do not accept this token from inbound WhatsApp messages or command arguments.
- The authorizer is not an HTTP server or a complete account-login system. No public pairing endpoint exists.

Generate independent secrets locally:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

## Reconnect supervisor

lib/transport-supervisor.js closes a failed transport before retrying, uses bounded exponential backoff, stops after the configured retry limit, and stops immediately on Baileys logout status 401. It never automatically requests a new pairing code.

## Pairing the actual SHADOW account

The approved Atlas target is Project 0 / Cluster0, using the isolated shadow database and shadow_auth_state collection. The local pairing utility is npm run pair.

1. Set the SHADOW MongoDB URI, database, collection, session ID, encryption key, and two independent pairing tokens in a private config.env file.
2. Set OWNER_NUMBER to the international digits-only number for the SHADOW owner account.
3. Run npm run pair -- 2547XXXXXXXX on a trusted local machine.
4. Enter the one-time code in WhatsApp Linked devices and wait for the CLI to confirm credential persistence.
5. Start npm start with the same database and encryption settings.

Do not use a different bot's MongoDB database or WhatsApp session. The Atlas database user password must be set/reissued privately before pairing. The actual WhatsApp account must belong to or be explicitly authorized by the user.

## Verification still required

- Confirm a live MongoDB connection using the application driver.
- Complete the authorized WhatsApp pairing and confirm encrypted credentials are persisted.
- Restart the process and verify session recovery.
- Exercise live disconnect/reconnect and logout handling.
- Verify sender identity against the configured owner number. Group-admin commands remain disabled until metadata verification is implemented.
