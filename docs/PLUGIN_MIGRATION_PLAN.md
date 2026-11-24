# SHADOW Command Migration Plan

## Current decision

The external payload is **not approved for direct import or execution**. Its main runtime is heavily obfuscated, and selected plugins contain unsafe behavior or external dependencies that are not appropriate to copy unchanged.

SHADOW will use a clean, tracked runtime and a reviewed plugin allowlist. Plugin files will be migrated only after their dependencies, permissions, network calls, and filesystem behavior have been checked.

## Candidate features for a later review

These are candidates, not yet approved or implemented:

- Core: menu, ping, alive, runtime, owner information, help/list commands
- Group administration: promote, demote, kick, add, mute/unmute, group description/name, tag, tag-admins, group link
- Group protection: anti-link, anti-bad-word, anti-once, welcome/goodbye
- Media/conversion: sticker creation, image conversion, text-to-speech, QR generation, PDF utilities
- Information: weather, news, Wikipedia, dictionary, translation
- Fun: ship/match, jokes, reactions, fancy text

## Explicit exclusions

Do not migrate these original payload features:

- SMS bomber and unsolicited bulk SMS functionality
- Heroku account/app deletion and hard-coded Heroku credentials
- Third-party pairing relay that forwards phone numbers
- Unrestricted arbitrary-URL fetch command
- Automatic updater that fetches and runs unreviewed remote code
- Commands that perform broad destructive actions without safeguards
- Any plugin whose source or dependency behavior cannot be reviewed

## Migration requirements

Each plugin must pass all of the following before it is enabled:

1. Readable source tracked in this repository and pinned to a reviewed revision.
2. No embedded credentials, tokens, or private phone numbers.
3. No hidden remote code loading, dynamic evaluation, or self-modifying file writes.
4. Explicit authorization checks for owner/admin actions.
5. Bounded network requests, timeouts, and safe URL handling.
6. No destructive action without a narrow target and confirmation.
7. A documented command name, aliases, permissions, dependencies, and test case.

## Runtime requirements

The new runtime must:

- Load only an explicit allowlist of local plugin files.
- Keep configuration and session storage separate from plugin source.
- Never download executable code at startup.
- Never delete or overwrite source/configuration during startup.
- Keep pairing/session setup under SHADOW's own reviewed implementation.
- Expose health/status information without requiring an inbound web server unless needed by the chosen host.

## Current implementation status

No command plugins have been enabled from the external payload. The original obfuscated bootstrapper remains a deployment blocker until replaced. This document is a migration plan, not a claim that the listed commands already work.
