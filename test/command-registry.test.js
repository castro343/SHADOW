'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CommandRegistry, canExecute } = require('../lib/command-registry');
const { loadPlugins } = require('../lib/plugin-loader');
const registerCore = require('../plugins/core');

test('registers commands and resolves aliases', async () => {
  const registry = new CommandRegistry();
  registry.register({ name: 'hello', aliases: ['hi'], handler: ({ args }) => args.join(' ') });
  assert.equal(registry.get('hi').name, 'hello');
  const result = await registry.dispatch('.hi there friend');
  assert.deepEqual({ handled: result.handled, ok: result.ok, value: result.value }, {
    handled: true, ok: true, value: 'there friend'
  });
});

test('rejects duplicate names and aliases', () => {
  const registry = new CommandRegistry();
  registry.register({ name: 'hello', aliases: ['hi'], handler() {} });
  assert.throws(() => registry.register({ name: 'hi', handler() {} }), /already registered/);
  assert.throws(() => registry.register({ name: 'other', aliases: ['hi'], handler() {} }), /already registered/);
});

test('enforces owner and group-admin permissions', () => {
  assert.equal(canExecute('owner', {}), false);
  assert.equal(canExecute('owner', { isOwner: true }), true);
  assert.equal(canExecute('admin', { isGroupAdmin: true }), true);
  assert.equal(canExecute('admin', {}), false);
});

test('does not run a protected command for an ordinary member', async () => {
  const registry = new CommandRegistry();
  let ran = false;
  registry.register({ name: 'shutdown', permission: 'owner', handler() { ran = true; } });
  const result = await registry.dispatch('.shutdown', {});
  assert.equal(result.reason, 'permission-denied');
  assert.equal(ran, false);
});

test('ignores ordinary messages and reports unknown commands', async () => {
  const registry = new CommandRegistry();
  assert.equal((await registry.dispatch('hello')).reason, 'not-a-command');
  assert.equal((await registry.dispatch('.missing')).reason, 'unknown-command');
});

test('loads only explicitly allowlisted plugin modules', () => {
  const calls = [];
  const registry = { register() {} };
  const loaded = loadPlugins({
    registry,
    allowlist: ['core'],
    pluginDirectory: '/safe/plugins',
    load(file) {
      calls.push(file);
      return (target) => target.register();
    }
  });
  assert.deepEqual(loaded, ['core']);
  assert.deepEqual(calls, ['/safe/plugins/core.js']);
  assert.throws(() => loadPlugins({ registry, allowlist: ['../outside'], load() {} }), /Invalid plugin name/);
});

test('ports original main command names and aliases', async () => {
  const registry = new CommandRegistry();
  registerCore(registry);
  for (const name of ['ping', 'speed', 'pong', 'ping2', 'uptime', 'runtime', 'up', 'gpass', 'owner', 'repo', 'sc', 'script', 'info', 'menu2', 'allmenu', 'fullmenu', 'weather', 'wikipedia', 'wiki', 'alive', 'status', 'online', 'a', 'list', 'listcmd', 'commands', 'menu', 'help']) {
    assert.ok(registry.get(name), 'missing original command or alias: ' + name);
  }
  const owner = await registry.dispatch('.owner');
  const repo = await registry.dispatch('.sc');
  const fullMenu = await registry.dispatch('.allmenu');
  const weatherHelp = await registry.dispatch('.weather');
  const wikiHelp = await registry.dispatch('.wiki');
  const uptime = await registry.dispatch('.runtime');
  const password = await registry.dispatch('.gpass 20');
  const badPassword = await registry.dispatch('.gpass 7');
  const ping = await registry.dispatch('.ping');
  const alive = await registry.dispatch('.alive');
  const list = await registry.dispatch('.commands');
  const menu = await registry.dispatch('.help');
  assert.match(owner.value, /OWNER/);
  assert.match(repo.value, /github.com\\/castro343\\/SHADOW/);
  assert.match(fullMenu.value, /FULL COMMAND LIST/);
  assert.match(weatherHelp.value, /Usage: \.weather/);
  assert.match(wikiHelp.value, /Usage: \.wikipedia/);
  assert.match(uptime.value, /UPTIME/);
  assert.match(password.value, /SHADOW PASSWORD/);
  assert.match(password.value.split('\n\n')[1], /^[\s\S]{20}$/);
  assert.match(badPassword.value, /Usage: \.gpass/);
  assert.match(ping.value, /SPEED/);
  assert.match(alive.value, /STATUS/);
  assert.match(list.value, /\.ping/);
  assert.match(menu.value, /\.menu/);
});
