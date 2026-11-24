# SHADOW Runtime Foundation — Test Results

**Date:** 2026-11-24  
**Command:** `node --test`  
**Runtime used for this test run:** Node.js v22.16.0

## Result

- Tests: 7
- Passed: 7
- Failed: 0
- Skipped: 0

Covered behaviors:

1. Command registration and alias resolution.
2. Duplicate command and alias rejection.
3. Owner and group-admin permission decisions.
4. Blocking a protected command for an ordinary member.
5. Ignoring ordinary messages and reporting unknown commands.
6. Explicit plugin allowlisting and rejection of path-traversal names.
7. Core plugin registration and local `.ping` / `.help` dispatch.

## Runtime-version qualification

The repository currently declares Node.js `>=24.x`. The available execution environment for this run was Node.js 22.16.0. The seven tests passed on that runtime, but this is not a substitute for a Node.js 24 CI run. Before deployment, run the same suite on Node.js 24 and add a CI check.

These are isolated unit tests. They do not test a live WhatsApp connection, pairing, session persistence, group metadata, or end-to-end message delivery. The safe startup guard remains in place.
