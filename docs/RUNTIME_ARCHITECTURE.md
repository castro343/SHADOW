# SHADOW Runtime Architecture

This document describes the clean runtime foundation. It does not enable WhatsApp connectivity or any plugin.

## Runtime layers

1. **Configuration** — validated environment values; secrets remain outside Git.
2. **Transport** — `lib/whatsapp-transport.js` creates a Baileys socket with encrypted MongoDB auth state, filters inbound events, and keeps pairing behind an injected owner-authorization callback. It must not download or execute code.
3. **Owner gate** — `lib/owner-auth.js` compares a trusted boundary's pairing token using `crypto.timingSafeEqual`. `SHADOW_PAIRING_TOKEN` must be generated as a random secret of at least 32 bytes, stored only in the host's secret manager, and never accepted from a WhatsApp message.
4. **Reconnect supervisor** — `lib/transport-supervisor.js` closes failed transports before retrying, uses bounded exponential delays, and stops instead of reconnecting when Baileys reports logged-out status 401.
5. **Message normalization** — converts transport events into a small, documented message context.
6. **Command registry** — validates command names, aliases, and permission levels.
7. **Plugin loader** — loads only exact names from a code-reviewed local allowlist. It never scans directories or accepts a name from a message.
8. **Services** — bounded, narrowly scoped integrations used by individual commands.

## Permission trust boundary

The isOwner and isGroupAdmin flags must be computed by the trusted transport adapter from the authenticated sender and current group metadata. Never accept these flags from command text, user-provided JSON, or plugin arguments.

Permission levels currently supported: public, admin, and owner. Group-admin commands may also be run by the verified owner.

## Plugin contract

A plugin is a local CommonJS module exporting one registration function:

~~~js
module.exports = function registerCore(registry) {
  registry.register({
    name: 'ping',
    description: 'Check whether SHADOW is responding.',
    permission: 'public',
    handler: async () => 'Pong!'
  });
};
~~~

The plugin is inert until its exact file name is added to the runtime's reviewed allowlist. Do not add a plugin simply because it exists in an upstream fork.

## Current boundary

- A transport factory exists, but the startup guard does not invoke it and no live WhatsApp socket has been created.
- The encrypted MongoDB auth-state adapter, pairing-number validator, timing-safe owner token authorizer, and bounded reconnect supervisor exist; no production session has been loaded or written.
- The owner authorizer is only a gate primitive. No trusted CLI/HTTP owner-control surface exists yet, so pairing remains unavailable in the live application.
- Reconnect policy is unit-tested with injected transports and delays. A live Baileys disconnect/reconnect cycle has not been exercised.
- No plugins are enabled by default.
- No remote code, dynamic evaluation, or automatic updater is permitted.
- The startup guard remains active until the transport and configuration layers have tests and a complete review.
