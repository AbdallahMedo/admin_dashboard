import { api } from '../api/client.js';
import { authState } from '../state/authState.js';
import { modal } from '../ui/modal.js';
import { i18n } from '../i18n.js';

export const messagesEndpoint = '/api/admin/contact-messages';
export const escapeMessage = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const t = (en, ar) => i18n.isRtl() ? ar : en;
const dateText = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(i18n.isRtl() ? 'ar-EG' : 'en-EG');
};
export function messageError(error) {
  const errors = {
    400: t('Invalid pagination. Refresh to return to the first page.', 'بيانات الصفحة غير صالحة. حدّث للعودة للصفحة الأولى.'),
    401: t('Login required. Please sign in again.', 'يرجى تسجيل الدخول مرة أخرى.'),
    403: t('Admin access required.', 'هذه الصفحة متاحة للمسؤولين فقط.'),
    404: t('Message not found.', 'الرسالة غير موجودة.')
  };
  return errors[error.status] || error.message || t('Could not load messages.', 'تعذر تحميل الرسائل.');
}
export function updateMessagesBadge(total) {
  const badge = document.getElementById('sidebar-messages-badge');
  if (!badge) return;
  badge.hidden = !(Number.isInteger(total) && total > 0);
  badge.textContent = badge.hidden ? '' : String(total);
  badge.setAttribute('aria-label', `${total ?? 0} ${t('contact messages', 'رسالة تواصل')}`);
}
let countRequest = null;
export function refreshMessagesBadge() {
  if (countRequest) return countRequest;
  const token = authState.accessToken;
  const base = authState.getBaseUrl();
  countRequest = api.request(`${messagesEndpoint}/count`).then(result => {
    if (token === authState.accessToken && base === authState.getBaseUrl()) updateMessagesBadge(result.totalCount);
  }).catch(() => {
    if (token === authState.accessToken) updateMessagesBadge(null);
  }).finally(() => { countRequest = null; });
  return countRequest;
}
export function messageDetailHtml(row) {
  return `<div class="message-detail"><dl>
    <dt>${t('Name', 'الاسم')}</dt><dd dir="auto">${escapeMessage(row.fullName)}</dd>
    <dt>${t('Email', 'البريد الإلكتروني')}</dt><dd dir="auto">${escapeMessage(row.email)}</dd>
    <dt>${t('Mobile', 'رقم الهاتف')}</dt><dd dir="ltr">${escapeMessage(row.phoneNumber)}</dd>
    <dt>${t('Subject', 'الموضوع')}</dt><dd dir="auto">${escapeMessage(row.subject)}</dd>
    <dt>${t('Received', 'تاريخ الاستلام')}</dt><dd>${escapeMessage(dateText(row.createdAt))}</dd>
    </dl><p class="message-body" dir="auto">${escapeMessage(row.message)}</p></div>`;
}
export async function renderMessagesView(container) {
  container.innerHTML = `<section class="messages-page">
    <div class="delivery-heading"><div><h2>${t('Contact Messages', 'رسائل التواصل')}</h2><p>${t('Customer inquiries from your contact form.', 'استفسارات العملاء من نموذج التواصل.')}</p></div>
    <button class="btn btn-secondary" id="messages-refresh">${t('Refresh', 'تحديث')}</button></div>
    <div class="card"><div class="delivery-toolbar"><label class="form-label" for="messages-search">${t('Search this page', 'البحث في هذه الصفحة')}<input class="form-control" id="messages-search" type="search" dir="auto"></label><span id="messages-count" role="status"></span></div>
    <p id="messages-status" role="status"></p><div class="table-container"><table class="data-table"><thead><tr>
    ${[t('Name', 'الاسم'), t('Email', 'البريد الإلكتروني'), t('Mobile', 'رقم الهاتف'), t('Subject', 'الموضوع'), t('Received date', 'تاريخ الاستلام'), t('Actions', 'الإجراءات')].map(label => `<th scope="col">${label}</th>`).join('')}
    </tr></thead><tbody id="messages-list"></tbody></table></div>
    <div class="messages-pagination"><button class="btn btn-secondary" id="messages-prev">${t('Previous', 'السابق')}</button><span id="messages-page"></span><button class="btn btn-secondary" id="messages-next">${t('Next', 'التالي')}</button></div></div></section>`;
  const root = container.querySelector('.messages-page');
  const list = root.querySelector('#messages-list');
  const status = root.querySelector('#messages-status');
  const search = root.querySelector('#messages-search');
  const refresh = root.querySelector('#messages-refresh');
  const prev = root.querySelector('#messages-prev');
  const next = root.querySelector('#messages-next');
  let page = 1, total = 0, rows = [], loading = false;
  function render() {
    const term = search.value.trim().toLocaleLowerCase();
    const visible = rows.filter(row => [row.fullName, row.email, row.phoneNumber, row.subject, row.message].join(' ').toLocaleLowerCase().includes(term));
    root.querySelector('#messages-count').textContent = `${total} ${t('messages', 'رسالة')}`;
    root.querySelector('#messages-page').textContent = `${page} / ${Math.max(1, Math.ceil(total / 20))}`;
    prev.disabled = loading || page <= 1;
    next.disabled = loading || page * 20 >= total;
    list.innerHTML = visible.map(row => `<tr>
      <td dir="auto">${escapeMessage(row.fullName)}</td><td dir="auto">${escapeMessage(row.email)}</td>
      <td dir="ltr">${escapeMessage(row.phoneNumber)}</td><td dir="auto">${escapeMessage(row.subject)}</td>
      <td>${escapeMessage(dateText(row.createdAt))}</td><td><div class="message-actions">
      <button class="btn btn-secondary btn-sm" data-view="${escapeMessage(row.id)}">${t('View', 'عرض')}</button>
      <a class="btn btn-secondary btn-sm" href="mailto:${escapeMessage(encodeURIComponent(row.email))}">${t('Reply by email', 'الرد بالبريد')}</a>
      <a class="btn btn-secondary btn-sm" href="tel:${escapeMessage(encodeURIComponent(row.phoneNumber))}">${t('Call', 'اتصال')}</a>
      </div></td></tr>`).join('') || `<tr><td colspan="6" class="messages-empty">${t(total === 0 ? 'No messages yet.' : 'No messages match your search.', total === 0 ? 'لا توجد رسائل حتى الآن.' : 'لا توجد رسائل تطابق البحث.')}</td></tr>`;
  }
  async function load(targetPage = page) {
    if (loading) return;
    loading = true;
    refresh.disabled = prev.disabled = next.disabled = true;
    status.textContent = t('Loading messages…', 'جارٍ تحميل الرسائل…');
    try {
      const result = await api.request(messagesEndpoint, { params: { page: targetPage, pageSize: 20 } });
      if (!Array.isArray(result?.items) || !Number.isInteger(result.totalCount) || result.totalCount < 0) throw new Error('Unexpected messages response.');
      if (!root.isConnected) return;
      rows = result.items; total = result.totalCount; page = targetPage;
      updateMessagesBadge(total);
      status.textContent = '';
      render();
    } catch (error) {
      if (root.isConnected) status.textContent = messageError(error);
    } finally {
      loading = false;
      refresh.disabled = false;
      prev.disabled = page <= 1;
      next.disabled = page * 20 >= total;
    }
  }
  list.addEventListener('click', async event => {
    const button = event.target.closest('[data-view]');
    if (!button || button.disabled) return;
    button.disabled = true;
    status.textContent = t('Loading message…', 'جارٍ تحميل الرسالة…');
    try {
      const row = await api.request(`${messagesEndpoint}/${encodeURIComponent(button.dataset.view)}`);
      if (!row || typeof row.message !== 'string') throw new Error('Unexpected message response.');
      if (!root.isConnected) return;
      status.textContent = '';
      modal.showModal({ title: t('Contact Message', 'رسالة تواصل'), contentHtml: messageDetailHtml(row), size: 'lg' });
    } catch (error) {
      if (root.isConnected) status.textContent = messageError(error);
    } finally { button.disabled = false; }
  });
  search.addEventListener('input', render);
  refresh.addEventListener('click', () => load(1));
  prev.addEventListener('click', () => load(page - 1));
  next.addEventListener('click', () => load(page + 1));
  await load();
}
