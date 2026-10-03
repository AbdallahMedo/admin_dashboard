import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { location: { hash: '' } };
let badge = { hidden: false, textContent: '', setAttribute() {} };
globalThis.document = {
  getElementById: () => badge, addEventListener() {},
  body: { classList: { toggle() {} } },
  documentElement: { setAttribute() {} }
};
const { api } = await import('../src/js/api/client.js');
const { authState } = await import('../src/js/state/authState.js');
// These transport fixtures exercise relative requests explicitly.
authState.baseUrl = '';
const { messagesEndpoint, updateMessagesBadge, refreshMessagesBadge, messageDetailHtml, messageError, messageReplyLinks } = await import('../src/js/views/messagesView.js');
const { handleMockRequest } = await import('../src/js/api/mockServer.js');

test('message badge displays positive totals and hides zero or invalid totals', () => {
  updateMessagesBadge(12);
  assert.equal(badge.textContent, '12');
  assert.equal(badge.hidden, false);
  for (const count of [0, null, -1, undefined]) {
    updateMessagesBadge(count);
    assert.equal(badge.hidden, true);
    assert.equal(badge.textContent, '');
  }
});

test('message APIs attach admin token and use supplied list, count and detail endpoints', async () => {
  authState.accessToken = 'admin-token';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(url.endsWith('/count') ? { totalCount: 12 } : {});
  };
  await api.request(messagesEndpoint, { params: { page: 2, pageSize: 20 } });
  await api.request(`${messagesEndpoint}/test-id`);
  await refreshMessagesBadge();
  assert.deepEqual(calls.map(call => call.url), [
    '/api/admin/contact-messages?page=2&pageSize=20',
    '/api/admin/contact-messages/test-id', '/api/admin/contact-messages/count'
  ]);
  assert.ok(calls.every(call => call.options.headers.Authorization === 'Bearer admin-token'));
  assert.equal(badge.textContent, '12');
  globalThis.fetch = async () => { throw new Error('Offline'); };
  await refreshMessagesBadge();
  assert.equal(badge.hidden, true);
});

test('message detail escapes untrusted markup and preserves line breaks', () => {
  const html = messageDetailHtml({ fullName: '<img onerror=alert(1)>', subject: '<script>', email: 'x@y.com', phoneNumber: '01001234567', message: 'Hello\n<script>alert(1)</script>', createdAt: '2026-10-03T10:30:00Z' });
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('Hello\n&lt;script&gt;'));
  assert.ok(html.includes('message-body'));
});

test('mock matches pagination, count, details, empty pages and validation contract', async () => {
  const response = await handleMockRequest('GET', messagesEndpoint);
  assert.equal(response.data.totalCount, 1);
  const id = response.data.items[0].id;
  assert.equal((await handleMockRequest('GET', `${messagesEndpoint}/${id}`)).data.id, id);
  assert.equal((await handleMockRequest('GET', `${messagesEndpoint}/count`)).data.totalCount, 1);
  assert.deepEqual((await handleMockRequest('GET', messagesEndpoint, null, { page: 2 })).data.items, []);
  for (const params of [{ page: 0 }, { pageSize: 101 }, { pageSize: 0 }, { page: 1.5 }]) {
    assert.equal((await handleMockRequest('GET', messagesEndpoint, null, params)).status, 400);
  }
  assert.equal((await handleMockRequest('GET', `${messagesEndpoint}/missing`)).status, 404);
  for (const status of [400, 401, 403, 404]) assert.ok(messageError({ status }));
});

test('reply links preserve recipient and encode subject without injecting mail headers', () => {
  const links = messageReplyLinks({ email: ' nour@example.com ', subject: 'Villa & design\nCc: other' });
  assert.ok(links.mailto.startsWith('mailto:nour@example.com?subject='));
  assert.ok(!links.mailto.includes('%0A'));
  const gmail = new URL(links.gmail);
  assert.equal(gmail.origin, 'https://mail.google.com');
  assert.equal(gmail.searchParams.get('to'), 'nour@example.com');
  assert.equal(gmail.searchParams.get('su'), 'Re: Villa & design Cc: other');
});