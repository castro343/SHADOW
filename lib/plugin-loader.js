'use strict';

const path = require('node:path');

const PLUGIN_NAME = /^[a-z0-9][a-z0-9_-]{0,47}$/;

function loadPlugins({ registry, allowlist = [], pluginDirectory = path.join(__dirname, '..', 'plugins'), load = require }) {
  if (!registry || typeof registry.register !== 'function') {
    throw new TypeError('A command registry is required.');
  }
  if (!Array.isArray(allowlist)) throw new TypeError('Plugin allowlist must be an array.');

  const seen = new Set();
  const loaded = [];
  const root = path.resolve(pluginDirectory);

  for (const name of allowlist) {
    if (typeof name !== 'string' || !PLUGIN_NAME.test(name)) {
      throw new TypeError(`Invalid plugin name in allowlist: ${String(name)}`);
    }
    if (seen.has(name)) throw new Error(`Duplicate plugin in allowlist: ${name}`);
    seen.add(name);

    const file = path.resolve(root, `${name}.js`);
    if (path.dirname(file) !== root) throw new Error('Plugin path escaped the plugin directory.');
    const registerPlugin = load(file);
    if (typeof registerPlugin !== 'function') {
      throw new TypeError(`Plugin "${name}" must export a registration function.`);
    }
    registerPlugin(registry);
    loaded.push(name);
  }

  return loaded;
}

module.exports = { loadPlugins };
