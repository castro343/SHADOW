'use strict';

const os = require('node:os');
const crypto = require('node:crypto');
const config = require('../config');

function formatUptime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return [days ? days + 'd' : '', hours ? hours + 'h' : '', minutes ? minutes + 'm' : '', secs + 's'].filter(Boolean).join(' ');
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'SHADOW-WhatsApp-Bot/1.0' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('External service returned HTTP ' + response.status);
  return response.json();
}

module.exports = function registerCore(registry) {
  registry.register({
    name: 'uptime',
    aliases: ['runtime', 'up'],
    description: 'Show how long SHADOW has been running.',
    permission: 'public',
    handler: async () => '𝐒𝐇𝐀𝐃𝐎𝐖 UPTIME: ' + formatUptime(process.uptime())
  });

  registry.register({
    name: 'gpass',
    description: 'Generate a cryptographically random password.',
    permission: 'public',
    handler: async ({ args }) => {
      const length = args[0] === undefined ? 12 : Number(args[0]);
      if (!Number.isInteger(length) || length < 8 || length > 128) return 'Usage: .gpass [length 8-128]';
      const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
      let password = '';
      for (let i = 0; i < length; i += 1) password += alphabet[crypto.randomInt(alphabet.length)];
      return '🔐 SHADOW PASSWORD (' + length + ' characters)\n\n' + password;
    }
  });

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

  registry.register({
    name: 'alive',
    aliases: ['status', 'online', 'a'],
    description: 'Show SHADOW status and uptime.',
    permission: 'public',
    handler: async () => [
      '╭───〔 🤖 SHADOW STATUS 〕───',
      '│ Bot: Active & Online',
      '│ Owner: ' + (config.OWNER_NAME || 'CASTRO'),
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
      const lines = registry.list().map(command => {
        const aliases = command.aliases.length ? ' (aliases: ' + command.aliases.join(', ') + ')' : '';
        return '• .' + command.name + aliases + ' — ' + (command.description || 'No description');
      });
      return '𝐒𝐇𝐀𝐃𝐎𝐖 COMMANDS\n\n' + lines.join('\n');
    }
  });

  registry.register({
    name: 'owner',
    description: 'Show SHADOW owner contact details.',
    permission: 'public',
    handler: async () => {
      const number = String(config.OWNER_NUMBER || '').replace(/\D/g, '');
      return number
        ? '𝐒𝐇𝐀𝐃𝐎𝐖 OWNER\nName: ' + (config.OWNER_NAME || 'CASTRO') + '\nWhatsApp: https://wa.me/' + number
        : '𝐒𝐇𝐀𝐃𝐎𝐖 OWNER\nName: ' + (config.OWNER_NAME || 'CASTRO') + '\nOwner contact has not been configured yet.';
    }
  });

  registry.register({
    name: 'repo',
    aliases: ['sc', 'script', 'info'],
    description: 'Show the SHADOW source repository.',
    permission: 'public',
    handler: async () => '𝐒𝐇𝐀𝐃𝐎𝐖 SOURCE\nhttps://github.com/castro343/SHADOW'
  });

  registry.register({
    name: 'menu2',
    aliases: ['allmenu', 'fullmenu'],
    description: 'Show all commands currently enabled in SHADOW.',
    permission: 'public',
    handler: async () => '𝐒𝐇𝐀𝐃𝐎𝐖 — FULL COMMAND LIST\n\n' +
      registry.list().map(c => '.' + c.name + (c.aliases.length ? ' (' + c.aliases.join(', ') + ')' : '')).join('\n')
  });

  registry.register({
    name: 'weather',
    description: 'Get current weather for a city or town.',
    permission: 'public',
    handler: async ({ args }) => {
      const place = args.join(' ').trim();
      if (!place || place.length > 100) return 'Usage: .weather <city or town>';
      try {
        const geo = await fetchJson('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(place) + '&count=1&language=en&format=json');
        const location = geo.results && geo.results[0];
        if (!location) return 'Location not found. Check the spelling and try again.';
        const weather = await fetchJson('https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(location.latitude) +
          '&longitude=' + encodeURIComponent(location.longitude) +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto');
        const current = weather.current;
        if (!current) return 'Weather data is temporarily unavailable.';
        return '🌤️ WEATHER — ' + location.name + (location.country ? ', ' + location.country : '') +
          '\nTemperature: ' + current.temperature_2m + '°C' +
          '\nFeels like: ' + current.apparent_temperature + '°C' +
          '\nHumidity: ' + current.relative_humidity_2m + '%' +
          '\nWind: ' + current.wind_speed_10m + ' km/h' +
          '\nPrecipitation: ' + current.precipitation + ' mm' +
          '\nWeather code: ' + current.weather_code;
      } catch {
        return 'Could not fetch weather right now. Please try again later.';
      }
    }
  });

  registry.register({
    name: 'wikipedia',
    aliases: ['wiki'],
    description: 'Search Wikipedia for a short article summary.',
    permission: 'public',
    handler: async ({ args }) => {
      const query = args.join(' ').trim();
      if (!query || query.length > 120) return 'Usage: .wikipedia <search query>';
      try {
        const article = await fetchJson('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query.replace(/\s+/g, '_')));
        if (!article.extract) return 'No Wikipedia summary was found.';
        return '📖 ' + article.title + '\n\n' + article.extract.slice(0, 3500) + (article.content_urls?.desktop?.page ? '\n\nRead more: ' + article.content_urls.desktop.page : '');
      } catch {
        return 'Could not retrieve a Wikipedia summary. Try a different search phrase.';
      }
    }
  });

  registry.register({
    name: 'menu',
    aliases: ['help'],
    description: 'Show the available SHADOW commands.',
    permission: 'public',
    handler: async () => '𝐒𝐇𝐀𝐃𝐎𝐖 — COMMAND MENU\n\n' +
      registry.list().map(command => '• .' + command.name + ' — ' + (command.description || 'No description') +
        (command.aliases.length ? ' (also: ' + command.aliases.join(', ') + ')' : '')).join('\n')
  });
};
