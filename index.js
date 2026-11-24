'use strict';

/**
 * SHADOW — safe startup guard
 *
 * The inherited entrypoint was an obfuscated bootstrapper that downloaded and
 * executed code from an unrelated repository, deleted local files, and
 * overwrote configuration. It has intentionally been disabled.
 *
 * Do not replace this guard with a remote loader. The SHADOW runtime will be
 * added here only after its source, session flow, and plugin loader are
 * independently reviewed and tracked in this repository.
 */

console.error(
  [
    '',
    'SHADOW is not ready to connect to WhatsApp yet.',
    'The inherited remote-code bootstrapper has been disabled for security.',
    'No session was loaded and no external code was downloaded.',
    'See SECURITY_AUDIT.md and docs/PLUGIN_MIGRATION_PLAN.md.',
    ''
  ].join('\n')
);

process.exitCode = 1;
