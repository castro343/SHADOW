'use strict';

const DEFAULT_LOGGED_OUT_STATUS = 401;

function createTransportSupervisor({
  createTransport,
  onConnectionUpdate = () => {},
  onMessage = async () => {},
  onError = () => {},
  maxRetries = 5,
  baseDelayMs = 1000,
  maxDelayMs = 30000,
  loggedOutStatus = DEFAULT_LOGGED_OUT_STATUS,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
} = {}) {
  if (typeof createTransport !== 'function') throw new TypeError('createTransport is required.');
  if (!Number.isInteger(maxRetries) || maxRetries < 0) throw new TypeError('maxRetries must be a non-negative integer.');

  let stopped = true;
  let activeTransport = null;
  let retryTask = null;
  let generation = 0;
  let attempts = 0;

  async function closeActive() {
    const current = activeTransport;
    activeTransport = null;
    if (current && typeof current.close === 'function') {
      try { await current.close(); }
      catch { onError({ code: 'TRANSPORT_CLOSE_FAILED', message: 'SHADOW could not close the previous transport cleanly.' }); }
    }
  }

  async function connect(currentGeneration) {
    if (stopped || currentGeneration !== generation) return;
    try {
      const transport = await createTransport({
        onConnectionUpdate: update => {
          if (stopped || currentGeneration !== generation) return;
          try { onConnectionUpdate(update); } catch {}
          if (update.connection === 'open') {
            attempts = 0;
            return;
          }
          if (update.connection === 'close') {
            if (update.lastDisconnectStatusCode === loggedOutStatus) {
              stopped = true;
              generation += 1;
              void closeActive();
              onError({ code: 'WHATSAPP_LOGGED_OUT', message: 'SHADOW stopped because the WhatsApp session was logged out. Re-pairing requires explicit owner authorization.' });
              return;
            }
            scheduleRetry(currentGeneration);
          }
        },
        onMessage,
        onError
      });

      if (stopped || currentGeneration !== generation) {
        if (transport && typeof transport.close === 'function') await transport.close();
        return;
      }
      activeTransport = transport;
    } catch {
      onError({ code: 'TRANSPORT_START_FAILED', message: 'SHADOW could not start the WhatsApp transport.' });
      scheduleRetry(currentGeneration);
    }
  }

  function scheduleRetry(currentGeneration) {
    if (stopped || currentGeneration !== generation || retryTask) return;
    if (attempts >= maxRetries) {
      stopped = true;
      onError({ code: 'RECONNECT_LIMIT_REACHED', message: 'SHADOW stopped after reaching its reconnect limit.' });
      return;
    }

    const delay = Math.min(baseDelayMs * (2 ** attempts), maxDelayMs);
    attempts += 1;
    retryTask = (async () => {
      await closeActive();
      await sleep(delay);
      retryTask = null;
      if (!stopped && currentGeneration === generation) await connect(currentGeneration);
    })().catch(() => {
      retryTask = null;
      onError({ code: 'RECONNECT_FAILED', message: 'SHADOW reconnect attempt failed.' });
      scheduleRetry(currentGeneration);
    });
  }

  return {
    async start() {
      if (!stopped) return;
      stopped = false;
      attempts = 0;
      generation += 1;
      await connect(generation);
    },
    async stop() {
      if (stopped && !activeTransport && !retryTask) return;
      stopped = true;
      generation += 1;
      await closeActive();
      if (retryTask) await retryTask;
    },
    getState() {
      return { running: !stopped, retryAttempts: attempts, hasTransport: Boolean(activeTransport) };
    }
  };
}

module.exports = { createTransportSupervisor, DEFAULT_LOGGED_OUT_STATUS };
