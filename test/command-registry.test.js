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
  for (const name of ['ping', 'speed', 'pong', 'ping2', 'alive', 'status', 'online', 'a', 'list', 'listcmd', 'commands', 'menu', 'help']) {
    assert.ok(registry.get(name), 'missing original command or alias: ' + name);
  }
  const ping = await registry.dispatch('.ping');
  const alive = await registry.dispatch('.alive');
  const list = await registry.dispatch('.commands');
  const menu = await registry.dispatch('.help');
  assert.match(ping.value, /SHADOW SPEED/);
  assert.match(alive.value, /SHADOW STATUS/);
  assert.match(list.value, /\.ping/);
  assert.match(menu.value, /\.menu/);
});
