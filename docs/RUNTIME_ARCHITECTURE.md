# SHADOW Runtime Architecture

This document describes the clean runtime foundation. It does not enable WhatsApp connectivity or any plugin.

## Runtime layers

1. **Configuration** — validated environment values; secrets remain outside Git.
2. **Transport** — a separately reviewed WhatsApp/Baileys adapter. It must not download or execute code.
3. **Message normalization** — converts transport events into a small, documented message context.
4. **Command registry** — validates command names, aliases, and permission levels.
5. **Plugin loader** — loads only exact names from a code-reviewed local allowlist. It never scans directories or accepts a name from a message.
6. **Services** — bounded, narrowly scoped integrations used by individual commands.

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

- No WhatsApp socket is created.
- No pairing/session data is read or written.
- No plugins are enabled by default.
- No remote code, dynamic evaluation, or automatic updater is permitted.
- The startup guard remains active until the transport and configuration layers have tests and a complete review.
