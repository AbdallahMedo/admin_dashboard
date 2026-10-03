import { api } from '../api/client.js';

const endpoint = '/api/admin/delivery-governorates';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function deliveryStatus(row) {
  return !row.isActive ? 'Unavailable at checkout' : row.deliveryFee == null ? 'Not configured' : 'Available';
}

export function validationMessage(error) {
  const data = error.response;
  return [data?.message, data?.detail, ...Object.values(data?.errors || {}).flat()]
    .filter(Boolean).join('\n') || data?.title || error.message;
}

export async function renderDeliveryFeesView(container) {
  container.innerHTML = `
    <section class="delivery-page" aria-labelledby="delivery-title">
      <div class="delivery-heading"><div><h2 id="delivery-title">Delivery Fees</h2>
        <p>Mechanical Designs Decor · Delivery across Egypt’s 27 governorates</p></div>
        <button type="button" class="btn btn-secondary" id="delivery-refresh">Refresh</button></div>
      <p class="delivery-note">Set a fee and activate a governorate to make it available at checkout. Leave the fee blank to mark it as not configured.</p>
      <div class="card">
        <div class="delivery-toolbar"><div><label class="form-label" for="delivery-search">Search governorates</label>
          <input class="form-control" id="delivery-search" type="search" placeholder="Search English or Arabic name" dir="auto"></div>
          <span id="delivery-count" role="status"></span></div>
        <p id="delivery-message" class="delivery-message" role="status"></p>
        <div class="table-container"><table class="data-table delivery-table">
          <caption class="delivery-caption">Governorate delivery configuration · EGP</caption>
          <thead><tr><th scope="col">English name</th><th scope="col">Arabic name</th><th scope="col">Delivery fee (EGP)</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
          <tbody></tbody></table></div>
      </div>
    </section>`;
  const page = container.querySelector('.delivery-page');
  const tbody = page.querySelector('tbody');
  const search = page.querySelector('#delivery-search');
  const refresh = page.querySelector('#delivery-refresh');
  const message = page.querySelector('#delivery-message');
  let rows = [];
  let editing = null;
  let saving = false;
  let loaded = false;

  function renderRows() {
    const term = search.value.trim().toLocaleLowerCase();
    const visible = rows.filter(row => `${row.name} ${row.nameAr}`.toLocaleLowerCase().includes(term));
    page.querySelector('#delivery-count').textContent = `${visible.length} of ${rows.length} governorates`;
    tbody.innerHTML = visible.map(row => `<tr>
      <td lang="en" dir="ltr">${escapeHtml(row.name)}</td><td lang="ar" dir="rtl">${escapeHtml(row.nameAr)}</td>
      <td>${row.deliveryFee == null ? 'Not configured' : `${money.format(row.deliveryFee)} EGP`}</td>
      <td><span class="delivery-status ${deliveryStatus(row) === 'Available' ? 'delivery-available' : ''}">${deliveryStatus(row)}</span></td>
      <td><button type="button" class="btn btn-secondary btn-sm" data-edit="${escapeHtml(row.id)}" aria-label="Edit ${escapeHtml(row.name)}" ${saving ? 'disabled' : ''}>Edit</button></td>
    </tr>${String(row.id) === editing ? `<tr><td colspan="5"><form class="delivery-editor">
      <div class="form-group"><label class="form-label" for="delivery-fee">Delivery fee (EGP) · ${escapeHtml(row.name)}</label>
        <input id="delivery-fee" class="form-control" type="number" min="0" step="any" inputmode="decimal" value="${escapeHtml(row.deliveryFee)}" aria-describedby="delivery-fee-hint">
        <span class="form-hint" id="delivery-fee-hint">Blank = Not configured. Zero is a valid fee.</span></div>
      <label class="delivery-active"><input type="checkbox" id="delivery-active" ${row.isActive ? 'checked' : ''}> Active</label>
      <div class="delivery-editor-actions"><button class="btn btn-primary" type="submit">Save changes</button><button class="btn btn-secondary" type="button" data-cancel>Cancel</button></div>
      <p class="delivery-error" role="alert" tabindex="-1"></p>
    </form></td></tr>` : ''}`).join('') || '<tr><td colspan="5">No governorates match your search.</td></tr>';
  }

  async function load() {
    refresh.disabled = true;
    search.disabled = true;
    message.textContent = 'Loading governorates…';
    try {
      const result = await api.request(endpoint);
      if (!Array.isArray(result)) throw new Error('Unexpected governorate response. Please refresh to try again.');
      rows = result;
      loaded = true;
      editing = null;
      renderRows();
      message.textContent = rows.length === 27 ? '' : `The API returned ${rows.length} of Egypt’s 27 governorates. Refresh to check again.`;
    } catch (error) {
      message.textContent = `Could not load delivery fees: ${validationMessage(error)}`;
    } finally {
      refresh.disabled = false;
      search.disabled = !loaded;
    }
  }

  refresh.addEventListener('click', load);
  search.addEventListener('input', () => { editing = null; renderRows(); });
  tbody.addEventListener('click', event => {
    if (saving) return;
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      editing = edit.dataset.edit;
      renderRows();
      tbody.querySelector('#delivery-fee').focus();
    } else if (event.target.closest('[data-cancel]')) {
      editing = null;
      renderRows();
    }
  });
  tbody.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving) return;
    const form = event.target;
    const input = form.querySelector('#delivery-fee');
    const deliveryFee = input.value.trim() === '' ? null : Number(input.value);
    const errorBox = form.querySelector('.delivery-error');
    if (!input.checkValidity() || (deliveryFee !== null && (!Number.isFinite(deliveryFee) || deliveryFee < 0))) {
      errorBox.textContent = 'Enter a non-negative fee or leave it blank.';
      input.focus();
      return;
    }
    const id = editing;
    const body = { deliveryFee, isActive: form.querySelector('#delivery-active').checked };
    saving = true;
    refresh.disabled = search.disabled = true;
    tbody.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
    errorBox.textContent = '';
    message.textContent = 'Saving delivery fee…';
    let saved = false;
    try {
      const updated = await api.request(`${endpoint}/${encodeURIComponent(id)}`, { method: 'PUT', body });
      saved = true;
      if (updated && String(updated.id) === id && 'deliveryFee' in updated) {
        rows = rows.map(row => String(row.id) === id ? updated : row);
      } else {
        const result = await api.request(endpoint);
        if (!Array.isArray(result)) throw new Error('Unexpected governorate response.');
        rows = result;
      }
      editing = null;
      message.textContent = 'Delivery fee saved.';
    } catch (error) {
      errorBox.textContent = validationMessage(error);
      message.textContent = saved ? 'Saved, but the updated list could not be loaded. Refresh to retrieve the saved configuration.' : 'Could not save. Review the error and try again.';
      errorBox.focus();
    } finally {
      saving = false;
      refresh.disabled = search.disabled = false;
      if (editing === null) renderRows();
      else tbody.querySelectorAll('button, input').forEach(control => { control.disabled = false; });
    }
  });
  await load();
}
