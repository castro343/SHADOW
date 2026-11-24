'use strict';

const os = require('node:os');

function formatUptime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return [days ? days + 'd' : '', hours ? hours + 'h' : '', minutes ? minutes + 'm' : '', secs + 's'].filter(Boolean).join(' ');
}

module.exports = function registerCore(registry) {
  // Original ADEEL-MD main-ping.js command names and aliases.
  registry.register({
    name: 'ping',
    aliases: ['speed', 'pong'],
    description: 'Check SHADOW response speed.',
    permission: 'public',
    handler: async () => {
      const started = Date.now();
      await Promise.resolve();
      return '𝐒𝐇𝐀𝐃𝐎𝐖 SPEED: ' + (Date.now() - started) + 'ms';
    }
  });

  registry.register({
    name: 'ping2',
    description: 'Run the alternate ping check.',
    permission: 'public',
    handler: async () => '𝐒𝐇𝐀𝐃𝐎𝐖: PONG!'
  });

  // Original ADEEL-MD main-alive.js command names and aliases.
  registry.register({
    name: 'alive',
    aliases: ['status', 'online', 'a'],
    description: 'Show SHADOW status and uptime.',
    permission: 'public',
    handler: async () => [
      '╭───〔 🤖 SHADOW STATUS 〕───',
      '│ Bot: Active & Online',
      '│ Owner: CASTRO',
      '│ Host: ' + os.hostname(),
      '│ Uptime: ' + formatUptime(process.uptime()),
      '╰────────────────────────'
    ].join('\n')
  });

  registry.register({
    name: 'list',
    aliases: ['listcmd', 'commands'],
    description: 'List enabled commands and aliases.',
    permission: 'public',
    handler: async () => {
      const lines = registry.list().map((command) => {
        const aliases = command.aliases.length ? ' (aliases: ' + command.aliases.join(', ') + ')' : '';
        return '• .' + command.name + aliases + ' — ' + (command.description || 'No description');
      });
      return '𝐒𝐇𝐀𝐃𝐎𝐖 COMMANDS\n\n' + lines.join('\n');
    }
  });

  registry.register({
    name: 'menu',
    aliases: ['help'],
    description: 'Show the available SHADOW commands.',
    permission: 'public',
    handler: async () => {
      const commands = registry.list();
      const lines = commands.map((command) => {
        const aliases = command.aliases.length ? ' (also: ' + command.aliases.join(', ') + ')' : '';
        return '• .' + command.name + ' — ' + (command.description || 'No description') + aliases;
      });
      return '𝐒𝐇𝐀𝐃𝐎𝐖 — COMMAND MENU\n\n' + lines.join('\n');
    }
  });
};
