# SHADOW Runtime Architecture

The entrypoint is wired to the reviewed runtime foundation. Only the minimal core plugin is enabled.

## Runtime layers

1. Configuration — private environment values; secrets remain outside Git.
2. Transport — lib/whatsapp-transport.js creates a Baileys socket with encrypted MongoDB auth state, filters inbound events, and exposes only a narrow text-reply callback to message handlers.
3. Owner gate — lib/owner-auth.js compares a trusted local pairing request token using crypto.timingSafeEqual. Pairing remains a separate local CLI operation; no public pairing endpoint exists.
4. Reconnect supervisor — lib/transport-supervisor.js closes failed transports before retrying, uses bounded exponential delays, and stops instead of reconnecting when Baileys reports logged-out status 401.
5. Message parsing — the entrypoint extracts text and captions from supported message shapes and ignores non-command messages.
6. Command registry — validates command names, aliases, and permission levels.
7. Plugin loader — loads only the exact reviewed core plugin. It never scans directories or accepts a plugin name from a message.

## Permission trust boundary

The owner flag is derived by comparing the authenticated sender JID to configured OWNER_NUMBER. No group-admin commands are enabled; the runtime explicitly supplies isGroupAdmin: false until group metadata can be fetched and verified through the transport boundary. Never accept permission flags from command text, user-provided JSON, or plugin arguments.

## Enabled commands

- .ping — health response.
- .menu and .help — list registered commands.

No inherited upstream plugin is enabled merely because its source exists in the fork.

## Operational boundary

- The startup entrypoint invokes the transport and reconnect supervisor.
- MongoDB and Baileys integrations are unit-tested with mocks; real Atlas connectivity and WhatsApp pairing have not been performed.
- The local pairing utility is separate from the long-running bot process.
- A live pairing, restart-recovery, and reconnect test is still required before deployment.
- No remote code, dynamic evaluation, automatic updater, SMS bomber, destructive Heroku controls, or unrestricted URL fetch is permitted.
