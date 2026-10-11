import { api } from '../api/client.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';

export function validPercentage(value) {
  return /^\d+(?:\.\d{1,2})?$/.test(String(value)) && Number(value) > 0 && Number(value) <= 100;
}
export function promoStatus(code, now = Date.now()) {
  if (code.usedAt || code.status === 'Used') return 'Used';
  if (code.status === 'Expired' || new Date(code.expiresAt).getTime() <= now) return 'Expired';
  return code.status || (code.isActive ? 'Active' : 'Disabled');
}
export function canTogglePromo(code, now = Date.now()) {
  return ['Active', 'Disabled'].includes(promoStatus(code, now)) && new Date(code.expiresAt).getTime() > now;
}
export async function renderPromoCodesView(container) {
  const ar = i18n.isRtl();
  const text = (en, arabic) => ar ? arabic : en;
  container.innerHTML = `
    <h2>${text('Promo Codes', 'أكواد الخصم')}</h2>
    <p>${text('Generate a single-use percentage discount on products. Shipping is excluded.', 'إنشاء كود خصم بنسبة مئوية يستخدم مرة واحدة على المنتجات بدون الشحن.')}</p>
    <form id="promo-form" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end;margin:1.5rem 0;">
      <label class="form-group">${text('Discount (%)', 'نسبة الخصم (%)')}<input class="form-input" name="percentage" type="number" min="0.01" max="100" step="0.01" required></label>
      <label class="form-group">${text('Expiry date and time', 'تاريخ ووقت انتهاء الصلاحية')}<input class="form-input" name="expiry" type="datetime-local" required></label>
      <button class="btn btn-primary" type="submit">${text('Generate code', 'إنشاء الكود')}</button>
    </form>
    <p id="promo-feedback" role="status"></p>
    <div class="table-container" style="overflow-x:auto"><table class="data-table"><thead><tr>
      <th>${text('Code', 'الكود')}</th><th>${text('Discount', 'الخصم')}</th><th>${text('Expires', 'انتهاء الصلاحية')}</th><th>${text('Status', 'الحالة')}</th><th>${text('Used at', 'تاريخ الاستخدام')}</th><th>${text('Actions', 'الإجراءات')}</th>
    </tr></thead><tbody id="promo-rows"></tbody></table></div>`;
  const tbody = container.querySelector('#promo-rows');
  const feedback = container.querySelector('#promo-feedback');
  const statuses = { Active: text('Active', 'نشط'), Used: text('Used', 'مستخدم'), Expired: text('Expired', 'منتهي'), Disabled: text('Disabled', 'معطل') };
  async function load() {
    tbody.innerHTML = `<tr><td colspan="6">${i18n.t('loading')}</td></tr>`;
    try {
      const codes = await api.request('/api/admin/promo-codes');
      tbody.replaceChildren();
      for (const code of codes) {
        const status = promoStatus(code);
        const row = document.createElement('tr');
        for (const value of [code.code, `${code.discountPercentage}%`, i18n.formatDateTime(code.expiresAt), statuses[status] || status, code.usedAt ? i18n.formatDateTime(code.usedAt) : '—']) {
          const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
        }
        const actions = document.createElement('td');
        const copy = document.createElement('button'); copy.className = 'btn btn-secondary btn-sm'; copy.textContent = text('Copy', 'نسخ');
        copy.onclick = async () => { try { await navigator.clipboard.writeText(code.code); toast.success(text('Copied', 'تم النسخ')); } catch { feedback.textContent = code.code; } };
        actions.append(copy);
        if (canTogglePromo(code)) {
          const toggle = document.createElement('button'); toggle.className = 'btn btn-secondary btn-sm'; toggle.textContent = status === 'Active' ? text('Disable', 'تعطيل') : text('Enable', 'تفعيل');
          toggle.onclick = async () => { if (!canTogglePromo(code)) { await load(); return; } toggle.disabled = true; try { await api.request(`/api/admin/promo-codes/${code.id}/status`, { method: 'PATCH', body: { isActive: status === 'Disabled' } }); await load(); } catch (err) { toast.error(err.message); toggle.disabled = false; } };
          actions.append(toggle);
        }
        row.append(actions); tbody.append(row);
      }
      if (!codes.length) { const row = tbody.insertRow(); const cell = row.insertCell(); cell.colSpan = 6; cell.textContent = text('No promo codes yet.', 'لا توجد أكواد خصم.'); }
    } catch (err) { tbody.replaceChildren(); const row = tbody.insertRow(); const cell = row.insertCell(); cell.colSpan = 6; cell.textContent = err.message; feedback.textContent = err.message; toast.error(err.message); }
  }
  container.querySelector('#promo-form').onsubmit = async event => {
    event.preventDefault();
    const form = event.currentTarget;
    feedback.textContent = '';
    if (!validPercentage(form.elements.percentage.value)) { feedback.textContent = text('Enter a percentage greater than 0 and at most 100, with at most two decimal places.', 'أدخل نسبة بين 0 و 100 بحد أقصى منزلتين عشريتين.'); return; }
    const expiry = new Date(form.elements.expiry.value);
    if (!Number.isFinite(expiry.getTime()) || expiry <= new Date()) { feedback.textContent = text('Select a future expiry date.', 'اختر تاريخ انتهاء في المستقبل.'); return; }
    const button = form.querySelector('button'); button.disabled = true;
    try {
      const code = await api.request('/api/admin/promo-codes', { method: 'POST', body: { discountPercentage: Number(form.elements.percentage.value), expiresAt: expiry.toISOString() } });
      feedback.textContent = text('Generated: ', 'تم إنشاء: ') + code.code; form.reset(); await load();
    } catch (err) { feedback.textContent = err.message; toast.error(err.message); }
    finally { button.disabled = false; }
  };
  await load();
}
