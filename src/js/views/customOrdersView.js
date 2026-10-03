import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { referenceImages, escapeImageHtml } from './customOrderImages.js';

let statusFilter = 'All';

export async function renderCustomOrdersView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Custom Design Enquiries</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Bespoke client requests, custom commissions, and reference inspiration boards.
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-custom-orders">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="filter-toolbar">
      <div class="filter-tabs" id="custom-order-status-tabs">
        <button class="filter-tab ${statusFilter === 'All' ? 'active' : ''}" data-status="All">All Inquiries</button>
        <button class="filter-tab ${statusFilter === 'New' ? 'active' : ''}" data-status="New">New Inquiries</button>
        <button class="filter-tab ${statusFilter === 'Contacted' ? 'active' : ''}" data-status="Contacted">Contacted</button>
        <button class="filter-tab ${statusFilter === 'Quoted' ? 'active' : ''}" data-status="Quoted">Quoted</button>
        <button class="filter-tab ${statusFilter === 'InProgress' ? 'active' : ''}" data-status="InProgress">In Progress</button>
        <button class="filter-tab ${statusFilter === 'Completed' ? 'active' : ''}" data-status="Completed">Completed</button>
      </div>
    </div>

    <!-- Custom Orders List -->
    <div style="display: flex; flex-direction: column; gap: 1rem;" id="custom-orders-container">
      <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
        Loading custom requests...
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      statusFilter = tab.getAttribute('data-status');
      loadCustomOrders();
    });
  });

  container.querySelector('#btn-refresh-custom-orders').addEventListener('click', () => loadCustomOrders());

  async function loadCustomOrders() {
    const listContainer = container.querySelector('#custom-orders-container');
    listContainer.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted);">Loading custom requests...</div>`;

    try {
      const params = statusFilter === 'All' ? {} : { status: statusFilter };
      const orders = await api.request('/api/admin/custom-orders', { method: 'GET', params });

      if (!orders || orders.length === 0) {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No custom inquiries found matching status: <strong>${statusFilter}</strong>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = orders.map(co => {
        let badgeClass = 'badge-pending';
        if (co.status === 'Contacted') badgeClass = 'badge-confirmed';
        if (co.status === 'Quoted') badgeClass = 'badge-shipped';
        if (co.status === 'InProgress') badgeClass = 'badge-admin';
        if (co.status === 'Completed') badgeClass = 'badge-delivered';

        const dateStr = new Date(co.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="card" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <h3 style="font-size: 1.15rem; font-weight: 700;">${co.title}</h3>
                  <span class="badge ${badgeClass}">${co.status}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                  Client: <strong>${co.customerName}</strong> (${co.customerEmail} &bull; ${co.customerPhone || 'N/A'}) &bull; Requested on ${dateStr}
                </div>
              </div>

              <div style="text-align: right;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Client Budget</span>
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary);">${co.budget || 'Open / Quotation Required'}</div>
              </div>
            </div>

            <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; background: var(--bg-surface-elevated); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              ${co.description}
            </p>

            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
              <!-- Reference images preview button -->
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <button class="btn btn-secondary btn-sm btn-view-ref-images" data-id="${co.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Inspect Reference Images (${referenceImages(co).length})
                </button>
              </div>

              <!-- Status transition dropdown -->
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Set Status:</span>
                <select class="form-select co-status-select" data-id="${co.id}" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;">
                  <option value="New" ${co.status === 'New' ? 'selected' : ''}>New</option>
                  <option value="Contacted" ${co.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                  <option value="Quoted" ${co.status === 'Quoted' ? 'selected' : ''}>Quoted</option>
                  <option value="InProgress" ${co.status === 'InProgress' ? 'selected' : ''}>In Progress</option>
                  <option value="Completed" ${co.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Reference Images Viewer (GET /api/admin/custom-orders/{id}/images)
      listContainer.querySelectorAll('.btn-view-ref-images').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          openCustomOrderImagesModal(id);
        });
      });

      // Status Change (PATCH /api/admin/custom-orders/{id}/status)
      listContainer.querySelectorAll('.co-status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          const id = sel.getAttribute('data-id');
          const newStatus = sel.value;
          try {
            await api.request(`/api/admin/custom-orders/${id}/status`, {
              method: 'PATCH',
              body: { status: newStatus }
            });
            toast.success(`Custom order marked as '${newStatus}'`);
            loadCustomOrders();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

    } catch (err) {
      toast.error(`Failed to load custom orders: ${err.message}`);
    }
  }

  await loadCustomOrders();
}

// Modal for GET /api/admin/custom-orders/{id}/images
async function openCustomOrderImagesModal(customOrderId) {
  try {
    const res = await api.request(`/api/admin/custom-orders/${customOrderId}/images`, { method: 'GET' });
    const images = referenceImages(res);

    const contentHtml = `
      <div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Client reference photographs and inspirational mockups submitted for bespoke fabrication:
        </div>
        ${images.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            ${images.map((img, index) => `
              <figure style="margin: 0; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle); background: var(--bg-surface-elevated);">
                <a href="${escapeImageHtml(img)}" target="_blank" rel="noopener noreferrer">
                  <img src="${escapeImageHtml(img)}" alt="Client reference image ${index + 1}" style="width: 100%; aspect-ratio: 4/3; object-fit: contain;">
                </a>
                <figcaption style="padding: .75rem;">
                  <span class="reference-image-error" role="status" hidden>Image could not be loaded. The file may be missing or the image server unavailable. </span>
                  <a href="${escapeImageHtml(img)}" target="_blank" rel="noopener noreferrer">Open original image ${index + 1}</a>
                </figcaption>
              </figure>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No reference images uploaded by customer.
          </div>
        `}
      </div>
    `;

    modal.showModal({
      title: `Client Reference Assets - ${escapeImageHtml(customOrderId)}`,
      contentHtml,
      size: 'lg',
      footerHtml: `<button class="btn btn-secondary" type="button" data-modal-close>Close Viewer</button>`,
      onOpen: overlay => {
        overlay.querySelectorAll('figure img').forEach(image => {
          const showError = () => {
            image.hidden = true;
            image.closest('figure').querySelector('.reference-image-error').hidden = false;
          };
          image.addEventListener('error', showError, { once: true });
          if (image.complete && image.naturalWidth === 0) showError();
        });
      }
    });

  } catch (err) {
    toast.error(`Could not fetch reference images: ${err.message}`);
  }
}
