> [!CAUTION]
> **Production deployment is not enabled yet.** The inherited remote-code bootstrapper has been disabled, and `index.js` intentionally remains a safe startup guard. Do not deploy SHADOW as a live bot until the remaining integration gates in [SECURITY_AUDIT.md](SECURITY_AUDIT.md) and [docs/OWNER_AUTH_AND_RECONNECT.md](docs/OWNER_AUTH_AND_RECONNECT.md) are complete.

# 𝐒𝐇𝐀𝐃𝐎𝐖

**A security-first WhatsApp Multi-Device bot foundation — built and customized by CASTRO.**

SHADOW is being rebuilt from tracked, reviewable source. The old remote bootstrapper, destructive Heroku controls, SMS-bombing features, third-party pairing relay, and unrestricted remote plugin loading are not part of the approved runtime.

## Project status

- Node.js 24+ codebase and automated unit-test workflow.
- Encrypted MongoDB-backed Baileys authentication-state adapter.
- Timing-safe owner pairing authorization and a local pairing-code CLI.
- Bounded reconnect policy with explicit stop on logged-out sessions.
- Explicit local plugin allowlist and minimal reviewed core commands.
- **No live WhatsApp account or production session has been connected.**
- **The default `npm start` entrypoint remains intentionally disabled.**

## Development checks

Install Node.js 24 or newer, then run:

```sh
npm test
```

GitHub Actions also checks the required exports from the pinned Baileys release and MongoDB driver. The CI dependency check is isolated from the project's full upstream dependency tree.

## Private runtime configuration

Use a private environment file or host secret manager. Never commit `config.env`, database credentials, session keys, or pairing tokens.

Required for the local pairing utility:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Dedicated MongoDB connection string |
| `MONGODB_DATABASE` | Database dedicated to SHADOW |
| `MONGODB_COLLECTION` | Auth-state collection (default: `shadow_auth_state`) |
| `SHADOW_SESSION_ID` | Isolated session identifier |
| `SHADOW_SESSION_ENCRYPTION_KEY` | 32-byte AES key, encoded as hex or base64 |
| `SHADOW_PAIRING_TOKEN` | Owner authorization secret (at least 32 random bytes) |
| `SHADOW_PAIRING_REQUEST_TOKEN` | Separately supplied bearer token for the local pairing invocation |

Generate random secrets in a trusted shell:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not reuse the same value for the encryption key and pairing token. Keep the pairing request token out of WhatsApp messages and source control.

## Local pairing utility (not a production deployment)

Only use this after configuring a **dedicated disposable test database** and confirming that the target phone/account is yours and authorized for testing.

```sh
npm run pair -- 2547XXXXXXXX
```

Use the full international phone number as digits only, including the country code. The utility waits for WhatsApp to connect, checks the owner token, requests one pairing code, prints it once, waits for the target phone to complete registration, confirms that the updated credentials were persisted, and then closes the transport. It does not expose a public HTTP pairing endpoint. It has not been exercised against a live WhatsApp account yet.

## Deployment

Render deployment is intentionally on hold. The safe startup guard exits rather than starting the inherited, unreviewed runtime. Do not change the start command or remove that guard to force a deployment.

## Upstream attribution

SHADOW is based on the Apache-2.0-licensed [ADEEL-MD](https://github.com/Adeel-Xtech/ADEEL-MD) project. The upstream LICENSE and required notices are retained.

## Disclaimer

SHADOW is an independent community project and is not affiliated with or endorsed by WhatsApp or Meta. Use responsibly and follow WhatsApp's terms and applicable laws. Unofficial automation may result in account restrictions.
