'use strict';

module.exports = function registerCore(registry) {
  registry.register({
    name: 'ping',
    description: 'Check whether SHADOW is responding.',
    permission: 'public',
    handler: async () => 'Pong! SHADOW command core is responding.'
  });

  registry.register({
    name: 'menu',
    aliases: ['help'],
    description: 'Show the available SHADOW commands.',
    permission: 'public',
    handler: async () => {
      const commands = registry.list();
      if (commands.length === 0) return 'No commands are enabled yet.';
      const lines = commands.map((command) => {
        const aliases = command.aliases.length ? ` (also: ${command.aliases.join(', ')})` : '';
        return `• .${command.name} — ${command.description || 'No description'}${aliases}`;
      });
      return `𝐒𝐇𝐀𝐃𝐎𝐖 — COMMAND MENU\n\n${lines.join('\n')}`;
    }
  });
};
