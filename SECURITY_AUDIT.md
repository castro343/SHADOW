# SHADOW Security Audit — Deployment Hold

**Status: NOT SAFE TO DEPLOY**

Reviewed on 2026-11-24 against the `shadow-branding` branch.

## Critical startup behavior found

The checked-in `index.js` is an obfuscated bootstrapper, not the actual WhatsApp bot command runtime. Its startup flow:

1. Defines a ZIP download URL pointing to a separate public repository:
   `jvgucuhihkvjkjbh/zovvkvchghhGogjYurubvVbbbbZz`.
2. Recursively deletes the local `adeel` directory if it already exists.
3. Downloads the remote repository's `main.zip` archive and extracts it into that directory.
4. Copies the downloaded `config.js` over the project's root `config.js`.
5. Changes the process working directory into the downloaded source tree.
6. Requires and executes the downloaded `index.js`.

The bootstrapper also uses obfuscated property names and dynamic `Function` construction. This prevents a dependable review of its full behavior by ordinary text inspection.

## Why deployment is blocked

- The bot source that actually runs is not version-pinned to a reviewed commit.
- A third-party repository can change independently and alter what SHADOW executes.
- Startup can delete local files and overwrite the project's configuration.
- The remote payload is itself heavily obfuscated and has not passed a complete security review.
- The command implementations are therefore not yet verified as safe or fully owned/maintainable within this repository.

This audit does **not** claim that the remote payload is proven malicious. It records that its behavior and provenance are not sufficiently trusted for production execution.

## Required remediation

1. Do not run this bootstrapper or deploy this branch to Render or another host.
2. Obtain the command source as ordinary tracked files, pinned to a specific reviewed commit.
3. Review all runtime files, dependencies, network destinations, filesystem writes, and credential/session handling.
4. Remove runtime downloading, recursive deletion, configuration replacement, and dynamic code execution.
5. Only then run static checks and an isolated test with a disposable WhatsApp account/session.

## Scope

This was a static review of the bootstrapper and repository structure. No bot code was executed, no WhatsApp session was connected, and no deployment was made.
