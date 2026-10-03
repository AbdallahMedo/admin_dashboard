import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { location: { hash: '' } };
const { api } = await import('../src/js/api/client.js');
const { authState } = await import('../src/js/state/authState.js');
// These transport fixtures exercise relative requests explicitly.
authState.baseUrl = '';
const { deliveryStatus, validationMessage } = await import('../src/js/views/deliveryFeesView.js');
const { handleMockRequest, resetMockData } = await import('../src/js/api/mockServer.js');
const path = '/api/admin/delivery-governorates';

test('all governorates remain listed through configuration and deactivation', async () => {
  resetMockData();
  let response = await handleMockRequest('GET', path);
  assert.equal(response.data.length, 27);
  assert.equal(new Set(response.data.map(row => row.id)).size, 27);
  assert.ok(response.data.every(row => row.name && row.nameAr && row.deliveryFee === null));
  const id = response.data[0].id;
  for (const body of [{ deliveryFee: 0, isActive: true }, { deliveryFee: 75.5, isActive: false }, { deliveryFee: null, isActive: true }]) {
    response = await handleMockRequest('PUT', `${path}/${id}`, body);
    assert.equal(response.status, 200);
    assert.equal(response.data.deliveryFee, body.deliveryFee);
    const list = await handleMockRequest('GET', path);
    assert.equal(list.data.length, 27);
    assert.deepEqual(list.data.find(row => row.id === id), response.data);
  }
  assert.equal((await handleMockRequest('PUT', `${path}/${id}`, { deliveryFee: -1, isActive: true })).status, 400);
});

test('checkout labels distinguish zero, null and inactive fees', () => {
  assert.equal(deliveryStatus({ deliveryFee: 0, isActive: true }), 'Available');
  assert.equal(deliveryStatus({ deliveryFee: null, isActive: true }), 'Not configured');
  assert.equal(deliveryStatus({ deliveryFee: null, isActive: false }), 'Unavailable at checkout');
  assert.equal(deliveryStatus({ deliveryFee: 75, isActive: false }), 'Unavailable at checkout');
  assert.equal(validationMessage({ response: { errors: { deliveryFee: ['Fee is too large.'] } } }), 'Fee is too large.');
});

test('Admin GET/PUT attach Bearer token and preserve nullable fee payload and validation', async () => {
  authState.accessToken = 'admin-token';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, ...options });
    return Response.json(options.method === 'GET' ? [] : JSON.parse(options.body));
  };
  await api.request(path);
  await api.request(`${path}/test-id`, { method: 'PUT', body: { deliveryFee: null, isActive: false } });
  assert.ok(calls.every(call => call.headers.Authorization === 'Bearer admin-token'));
  assert.equal(calls[1].method, 'PUT');
  assert.deepEqual(JSON.parse(calls[1].body), { deliveryFee: null, isActive: false });
  globalThis.fetch = async () => Response.json({ errors: { DeliveryFee: ['Fee must be non-negative.'] } }, { status: 400 });
  await assert.rejects(api.request(path), error => validationMessage(error) === 'Fee must be non-negative.');
});

test('concurrent expired requests share one refresh and retry with the new token', async () => {
  authState.accessToken = 'expired';
  authState.refreshToken = 'refresh';
  let refreshes = 0;
  let retries = 0;
  globalThis.fetch = async (url, options) => {
    if (url === '/api/auth/refresh') {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return Response.json({ accessToken: 'new-token', refreshToken: 'rotated', accessTokenExpiresAt: '2099-01-01' });
    }
    if (options.headers.Authorization === 'Bearer expired') return new Response(null, { status: 401 });
    assert.equal(options.headers.Authorization, 'Bearer new-token');
    retries++;
    return Response.json([]);
  };
  await Promise.all([api.request(path), api.request(path)]);
  assert.equal(refreshes, 1);
  assert.equal(retries, 2);
});

test('failed refresh rejects waiting requests and returns to login', async () => {
  authState.accessToken = 'expired';
  authState.refreshToken = 'refresh';
  globalThis.fetch = async () => new Response(null, { status: 401 });
  const results = await Promise.allSettled([api.request(path), api.request(path)]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(window.location.hash, '#/login');
  assert.equal(authState.accessToken, null);
});
