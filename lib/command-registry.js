'use strict';

const VALID_PERMISSIONS = new Set(['public', 'admin', 'owner']);

function normalizeCommand(value) {
  return String(value || '').trim().toLowerCase().replace(/^\./, '');
}

function canExecute(permission, context = {}) {
  if (!VALID_PERMISSIONS.has(permission)) return false;
  if (permission === 'public') return true;
  if (permission === 'owner') return context.isOwner === true;
  return context.isOwner === true || context.isGroupAdmin === true;
}

class CommandRegistry {
  constructor({ prefix = '.' } = {}) {
    if (typeof prefix !== 'string' || prefix.length < 1 || prefix.length > 3 || /\s/.test(prefix)) {
      throw new TypeError('Command prefix must be 1–3 non-space characters.');
    }
    this.prefix = prefix;
    this.commands = new Map();
    this.aliases = new Map();
  }

  register(command) {
    if (!command || typeof command !== 'object') throw new TypeError('A command definition is required.');
    const name = normalizeCommand(command.name);
    if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(name)) throw new TypeError('Invalid command name.');
    if (typeof command.handler !== 'function') throw new TypeError(`Command "${name}" needs a handler function.`);
    const permission = command.permission || 'public';
    if (!VALID_PERMISSIONS.has(permission)) throw new TypeError(`Invalid permission for "${name}".`);
    if (this.commands.has(name) || this.aliases.has(name)) throw new Error(`Command name already registered: ${name}`);

    const aliases = [...new Set((command.aliases || []).map(normalizeCommand).filter(Boolean))];
    for (const alias of aliases) {
      if (!/^[a-z0-9][a-z0-9_-]{0,31}$/.test(alias)) throw new TypeError(`Invalid alias: ${alias}`);
      if (this.commands.has(alias) || this.aliases.has(alias) || alias === name) {
        throw new Error(`Command alias already registered: ${alias}`);
      }
    }

    const definition = Object.freeze({
      name,
      description: String(command.description || ''),
      aliases: Object.freeze(aliases),
      permission,
      handler: command.handler
    });
    this.commands.set(name, definition);
    for (const alias of aliases) this.aliases.set(alias, name);
    return definition;
  }

  get(name) {
    const key = normalizeCommand(name);
    return this.commands.get(this.aliases.get(key) || key) || null;
  }

  list() {
    return [...this.commands.values()].map(({ handler, ...safe }) => safe);
  }

  async dispatch(text, context = {}) {
    if (typeof text !== 'string' || !text.startsWith(this.prefix)) return { handled: false, reason: 'not-a-command' };
    const body = text.slice(this.prefix.length).trim();
    if (!body) return { handled: false, reason: 'empty-command' };
    const [rawName, ...args] = body.split(/\s+/);
    const command = this.get(rawName);
    if (!command) return { handled: true, ok: false, reason: 'unknown-command' };
    if (!canExecute(command.permission, context)) {
      return { handled: true, ok: false, reason: 'permission-denied' };
    }
    try {
      const value = await command.handler({ ...context, args, command: command.name, prefix: this.prefix });
      return { handled: true, ok: true, value };
    } catch (error) {
      return { handled: true, ok: false, reason: 'handler-error', error };
    }
  }
}

module.exports = { CommandRegistry, canExecute, normalizeCommand };
