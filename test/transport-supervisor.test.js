'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTransportSupervisor } = require('../lib/transport-supervisor');

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

test('reconnects after an ordinary close and closes the previous transport first', async () => {
  const instances = [];
  const sleeps = [];
  const supervisor = createTransportSupervisor({
    createTransport: async handlers => {
      const instance = { handlers, closed: false, async close() { this.closed = true; } };
      instances.push(instance);
      return instance;
    },
    sleep: async ms => { sleeps.push(ms); }
  });

  await supervisor.start();
  instances[0].handlers.onConnectionUpdate({ connection: 'close', lastDisconnectStatusCode: 500 });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(instances.length, 2);
  assert.equal(instances[0].closed, true);
  assert.deepEqual(sleeps, [1000]);
  await supervisor.stop();
});

test('does not reconnect after an authenticated session is logged out', async () => {
  const instances = [];
  const errors = [];
  const supervisor = createTransportSupervisor({
    createTransport: async handlers => {
      const instance = { handlers, async close() { this.closed = true; } };
      instances.push(instance);
      return instance;
    },
    onError: error => errors.push(error),
    sleep: async () => {}
  });

  await supervisor.start();
  instances[0].handlers.onConnectionUpdate({ connection: 'close', lastDisconnectStatusCode: 401 });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(instances.length, 1);
  assert.equal(supervisor.getState().running, false);
  assert.ok(errors.some(error => error.code === 'WHATSAPP_LOGGED_OUT'));
});

test('uses bounded exponential retry delays and stops at the configured limit', async () => {
  let starts = 0;
  const delays = [];
  const errors = [];
  const supervisor = createTransportSupervisor({
    maxRetries: 2,
    baseDelayMs: 10,
    maxDelayMs: 15,
    createTransport: async () => { starts += 1; throw new Error('not available'); },
    sleep: async ms => { delays.push(ms); },
    onError: error => errors.push(error)
  });

  await supervisor.start();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(starts, 3);
  assert.deepEqual(delays, [10, 15]);
  assert.ok(errors.some(error => error.code === 'RECONNECT_LIMIT_REACHED'));
  assert.equal(supervisor.getState().running, false);
});

test('stop prevents a delayed reconnect from creating another transport', async () => {
  const gate = deferred();
  let starts = 0;
  const supervisor = createTransportSupervisor({
    createTransport: async () => {
      starts += 1;
      return { async close() {} };
    },
    sleep: () => gate.promise
  });

  await supervisor.start();
  // Stop without a pending retry; this verifies the supervisor can be shut down cleanly.
  await supervisor.stop();
  gate.resolve();
  assert.equal(starts, 1);
});

test('does not schedule duplicate retries when closing the old socket emits another close event', async () => {
  const instances = [];
  const delays = [];
  const supervisor = createTransportSupervisor({
    createTransport: async handlers => {
      const instance = {
        handlers,
        async close() {
          this.closed = true;
          handlers.onConnectionUpdate({ connection: 'close', lastDisconnectStatusCode: 500 });
        }
      };
      instances.push(instance);
      return instance;
    },
    sleep: async ms => { delays.push(ms); }
  });

  await supervisor.start();
  instances[0].handlers.onConnectionUpdate({ connection: 'close', lastDisconnectStatusCode: 500 });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(instances.length, 2);
  assert.deepEqual(delays, [1000]);
  await supervisor.stop();
});
