> [!CAUTION]
> **Live operation is not yet verified.** The old remote-code bootstrapper has been removed. The current entrypoint runs only the reviewed SHADOW transport, reconnect supervisor, and minimal core plugin. Do not point it at another bot's database or session.

# 𝐒𝐇𝐀𝐃𝐎𝐖

**A security-first WhatsApp Multi-Device bot — built and customized by CASTRO.**

SHADOW is rebuilt from tracked, reviewable source. The inherited remote bootstrapper, destructive Heroku controls, SMS-bombing features, third-party pairing relay, and unrestricted remote plugin loading are excluded.

## Current runtime

- Node.js 24+ entrypoint wired to encrypted MongoDB auth-state transport.
- Bounded reconnect supervisor with stop-on-logout behavior.
- Explicit local plugin allowlist; only the reviewed core plugin is enabled.
- .ping, .menu, and .help are the only enabled commands.
- Inbound replies use a narrow transport callback; plugins never receive the raw WhatsApp socket.
- Group-admin commands remain disabled until trusted group metadata verification is implemented.
- No live WhatsApp connection, pairing, Atlas persistence, or Render deployment has been verified yet.

## Development checks

Install Node.js 24 or newer, then run:

    npm test

GitHub Actions checks unit tests and required exports from pinned Baileys and MongoDB packages.

## Private runtime configuration

Set these values in a private config.env file or your hosting provider's secret manager. Never commit secrets.

| Variable | Purpose |
| --- | --- |
| MONGODB_URI | Connection string for the SHADOW database |
| MONGODB_DATABASE | Database dedicated to SHADOW |
| MONGODB_COLLECTION | Auth-state collection (default: shadow_auth_state) |
| SHADOW_SESSION_ID | Isolated SHADOW session identifier |
| SHADOW_SESSION_ENCRYPTION_KEY | 32-byte AES key, encoded as hex or base64 |
| OWNER_NUMBER | Owner's international phone number, digits only |
| SHADOW_PAIRING_TOKEN | Owner authorization secret, at least 32 random bytes |
| SHADOW_PAIRING_REQUEST_TOKEN | Separate local pairing invocation token |

Generate independent random secrets in a trusted shell:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Do not reuse the encryption key as either pairing token. Do not paste secrets into chat, WhatsApp, screenshots, or source control.

## First-time pairing

1. Configure a database and collection that belong exclusively to SHADOW. Do not reuse another bot's session database.
2. Configure the private environment variables above.
3. Run the local pairing utility with the phone number you own or are authorized to connect:

    npm run pair -- 2547XXXXXXXX

4. Enter the one-time code in WhatsApp's Linked devices flow and keep the process running until it confirms registration was saved.
5. Start SHADOW with npm start.

The pairing utility is local-only; it does not expose a public HTTP endpoint. It has not yet been tested against a live WhatsApp account.

## Deployment

Render deployment is not yet approved. Before deployment, verify Atlas connectivity, first-time pairing, credential persistence, restart recovery, and live reconnect behavior with the actual SHADOW-owned database and authorized account. Do not deploy with missing environment values or a borrowed session.

## Upstream attribution

SHADOW is based on the Apache-2.0-licensed ADEEL-MD project. The upstream LICENSE and required notices are retained.

## Disclaimer

SHADOW is an independent community project and is not affiliated with or endorsed by WhatsApp or Meta. Use responsibly and follow WhatsApp's terms and applicable laws. Unofficial automation may result in account restrictions.
