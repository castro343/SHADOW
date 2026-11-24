'use strict';

require('dotenv').config({ path: process.env.SHADOW_ENV_FILE || 'config.env' });

const config = require('./config');
const { createWhatsAppTransport } = require('./lib/whatsapp-transport');
const { createTransportSupervisor } = require('./lib/transport-supervisor');
const { CommandRegistry } = require('./lib/command-registry');
const { loadPlugins } = require('./lib/plugin-loader');

function normalizeOwnerJid(number) {
  const digits = String(number || '').replace(/\D/g, '');
  return digits ? digits + '@s.whatsapp.net' : '';
}

function extractText(message) {
  const content = message && message.message;
  if (!content) return '';
  const node = content.ephemeralMessage?.message ||
    content.viewOnceMessage?.message ||
    content.viewOnceMessageV2?.message ||
    content;
  return node.conversation ||
    node.extendedTextMessage?.text ||
    node.imageMessage?.caption ||
    node.videoMessage?.caption ||
    node.documentMessage?.caption ||
    node.buttonsResponseMessage?.selectedButtonId ||
    node.listResponseMessage?.singleSelectReply?.selectedRowId ||
    node.templateButtonReplyMessage?.selectedId ||
    '';
}

async function main() {
  const registry = new CommandRegistry({ prefix: config.PREFIX });
  loadPlugins({ registry, allowlist: ['core'] });

  const ownerJid = normalizeOwnerJid(config.OWNER_NUMBER);
  const supervisor = createTransportSupervisor({
    createTransport: handlers => createWhatsAppTransport({
      onConnectionUpdate: handlers.onConnectionUpdate,
      onMessage: handlers.onMessage,
      onError: handlers.onError
    }),
    onConnectionUpdate(update) {
      if (update.connection === 'open') {
        process.stdout.write('SHADOW WhatsApp connection is open.\n');
      } else if (update.connection === 'close') {
        process.stderr.write('SHADOW WhatsApp connection closed; reconnect policy will decide the next step.\n');
      }
    },
    async onMessage(message) {
      const commandText = extractText(message);
      if (!commandText || !commandText.startsWith(config.PREFIX)) return;

      const isOwner = Boolean(ownerJid && message.senderJid === ownerJid);
      const result = await registry.dispatch(commandText, {
        chatId: message.chatId,
        senderJid: message.senderJid,
        isGroup: message.isGroup,
        isOwner,
        // No admin-level commands are enabled until group metadata verification is implemented.
        isGroupAdmin: false,
        pushName: message.pushName
      });

      if (!result.handled) return;
      const response = result.ok
        ? (typeof result.value === 'string' ? result.value : '')
        : result.reason === 'permission-denied'
          ? 'You are not authorized to use that command.'
          : result.reason === 'unknown-command'
            ? 'Unknown command. Send .menu to see available commands.'
            : 'SHADOW could not complete that command.';
      if (response) await message.sendText(response);
    },
    onError(error) {
      process.stderr.write('[SHADOW] ' + (error?.message || error?.code || 'Runtime error') + '\n');
    }
  });

  await supervisor.start();
  process.stdout.write('SHADOW runtime started. Only reviewed core commands are enabled.\n');

  let stopping = false;
  const shutdown = async signal => {
    if (stopping) return;
    stopping = true;
    process.stdout.write('SHADOW received ' + signal + '; shutting down safely.\n');
    await supervisor.stop();
    process.exitCode = 0;
  };
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
}

main().catch(error => {
  process.stderr.write('[SHADOW] Startup failed: ' + error.message + '\n');
  process.exitCode = 1;
});
