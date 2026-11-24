# SHADOW WhatsApp Transport & Pairing Security

This is the implementation contract for the next transport milestone. It does not create a WhatsApp socket, request a pairing code, or load session data.

## Supported connection method

- SHADOW will use the reviewed `@whiskeysockets/baileys` dependency already declared in `package.json`.
- Pairing-code login is the intended first login flow; QR output will remain disabled in the hosted service.
- The pairing number must include the country calling code and contain digits only. For Kenya, the format begins with `254`, not the domestic leading `0`.
- Pairing must be explicitly initiated by the owner. It must never happen on every process boot.

## Pairing boundary

`lib/pairing.js` validates the number and refuses to request a code unless the socket explicitly reports an unregistered credential state. The caller must add rate limiting, owner-only authorization, a short-lived pairing state, and safe delivery of the code before exposing pairing through an HTTP route or chat command.

Never write pairing codes, phone numbers, auth credentials, or Signal keys to application logs.

## Session persistence requirements

The production auth-state adapter must persist both:
1. credential updates (`creds.update`), and
2. Signal key-store mutations (including `authState.keys.set()`).

A credentials-only database save is incomplete and can break message delivery. The adapter must serialize binary values safely, encrypt sensitive records at rest, scope every record to one account/session, and support atomic updates. Session secrets must never enter Git, build artifacts, public endpoints, or ordinary logs.

Baileys' multi-file auth helper is useful as a reference implementation, but SHADOW will not treat an ephemeral Render filesystem as durable production storage. A database-backed adapter must be reviewed and tested before hosted pairing is enabled.

## Connection lifecycle

- Create one socket per explicitly configured account.
- Register credential/key persistence handlers before accepting messages.
- Reconnect with bounded exponential backoff and jitter; do not create overlapping sockets.
- Stop reconnecting after logout or an explicit owner stop.
- Close sockets and flush persistence on graceful shutdown.
- Do not mark the account online unless configured; prefer `markOnlineOnConnect: false`.
- Do not process status/broadcast messages by default.
- Ignore messages sent by the bot itself and deduplicate inbound message IDs.

## Message trust boundary

The transport adapter alone derives sender JID, group JID, owner identity, and group-admin status from authenticated Baileys event data and fresh group metadata. Plugins never receive raw socket internals or a way to forge permission flags.

## Deployment gate

Do not enable `index.js` startup or deploy a live bot until:
- Node 24 CI is green;
- dependency versions are pinned and reviewed;
- durable encrypted auth/key storage is implemented and tested;
- pairing is owner-authorized, rate-limited, and never exposed publicly;
- reconnect/shutdown behavior has tests;
- inbound command dispatch has transport-level permission and deduplication tests.

## Explicitly excluded

No remote bootstrapper, automatic code updater, third-party pairing relay, SMS-bomber plugin, destructive Heroku token commands, unrestricted URL fetcher, or unreviewed upstream plugin may be re-enabled.
