import test from 'node:test';
import assert from 'node:assert';

let listener;

// Minimal chrome API stubs for testing
const chromeStub = {
  runtime: {
    id: 'test-extension',
    onMessage: {
      addListener(cb) {
        listener = cb;
      },
    },
    onInstalled: { addListener() {} },
    onStartup: { addListener() {} },
    onSuspend: { addListener() {} },
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
    },
  },
  tabs: {
    remove: async () => {},
  },
};

global.chrome = chromeStub;

process.env.SUPABASE_URL = 'https://example.com';
process.env.SUPABASE_ANON_KEY = 'anon';

require('../src/background.js');

const wait = () => new Promise((r) => setTimeout(r, 0));

test('rejects messages from unknown senders', async () => {
  let removed = false;
  chromeStub.tabs.remove = async () => {
    removed = true;
  };
  let response;
  listener({ type: 'AIDETOX_CLOSE_TAB' }, { id: 'unknown', tab: { id: 1 } }, (res) => {
    response = res;
  });
  await wait();
  assert.strictEqual(removed, false, 'tab should not be closed');
  assert.deepStrictEqual(response, { ok: false, error: 'unauthorized_sender' });
});

test('allows messages from our extension', async () => {
  let removed = false;
  chromeStub.tabs.remove = async () => {
    removed = true;
  };
  let response;
  listener({ type: 'AIDETOX_CLOSE_TAB' }, { id: chromeStub.runtime.id, tab: { id: 1 } }, (res) => {
    response = res;
  });
  await wait();
  assert.strictEqual(removed, true, 'tab should be closed');
  assert.deepStrictEqual(response, { ok: true });
});
