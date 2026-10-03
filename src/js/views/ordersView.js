import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';

let currentStatusFilter = 'All';

export async function renderOrdersView(container) {
  const isAr = i18n.isRtl();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${i18n.t('orders_title')}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${i18n.t('orders_subtitle')}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-orders">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          ${i18n.t('refresh')}
        </button>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="filter-toolbar">
      <div class="filter-tabs" id="order-status-tabs">
        <button class="filter-tab ${currentStatusFilter === 'All' ? 'active' : ''}" data-status="All">${i18n.t('all_orders')}</button>
        <button class="filter-tab ${currentStatusFilter === 'PendingConfirmation' ? 'active' : ''}" data-status="PendingConfirmation">${i18n.t('pending_confirmation')}</button>
        <button class="filter-tab ${currentStatusFilter === 'Confirmed' ? 'active' : ''}" data-status="Confirmed">${i18n.t('confirmed')}</button>
        <button class="filter-tab ${currentStatusFilter === 'Shipped' ? 'active' : ''}" data-status="Shipped">${i18n.t('shipped')}</button>
        <button class="filter-tab ${currentStatusFilter === 'Delivered' ? 'active' : ''}" data-status="Delivered">${i18n.t('delivered')}</button>
        <button class="filter-tab ${currentStatusFilter === 'Cancelled' ? 'active' : ''}" data-status="Cancelled">${i18n.t('cancelled')}</button>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.t('order_ref')}</th>
              <th>${i18n.t('customer_info')}</th>
              <th>${i18n.t('items_count')}</th>
              <th>${i18n.t('total_amount')}</th>
              <th>${i18n.t('payment_status')}</th>
              <th>${i18n.t('fulfillment_status')}</th>
              <th>${i18n.t('date')}</th>
              <th style="text-align: ${isAr ? 'left' : 'right'};">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr>
              <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                ${i18n.t('loading')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const tabs = container.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatusFilter = tab.getAttribute('data-status');
      loadOrders();
    });
  });

  container.querySelector('#btn-refresh-orders').addEventListener('click', () => loadOrders());

  async function loadOrders() {
    const tbody = container.querySelector('#orders-table-body');
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">${i18n.t('loading')}</td></tr>`;

    try {
      const params = currentStatusFilter === 'All' ? {} : { status: currentStatusFilter };
      const orders = await api.request('/api/admin/orders', { method: 'GET', params });

      if (!orders || orders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              ${i18n.t('no_data')}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = orders.map(order => {
        const status = order.orderStatus || order.status || 'PendingConfirmation';
        const badgeClass = getStatusBadge(status);
        const payment = order.paymentStatus || 'Unpaid';
        const payBadge = (payment === 'Paid' || payment === 'paid') ? 'badge-delivered' : 'badge-pending';
        const dateStr = i18n.formatDate(order.createdAt);
        const itemsCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
        const customer = order.customerName || order.customer?.name || (isAr ? 'عميل المتجر' : 'Store Client');
        const phone = order.phoneNumber || order.customer?.phoneNumber || '';
        const whatsapp = order.whatsAppNumber || order.customer?.whatsAppNumber || phone;
        const address = [order.address, order.city, order.governorate].filter(Boolean).join(', ');
        const total = order.total ?? order.totalAmount ?? 0;

        return `
          <tr>
            <td>
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: var(--primary);">
                ${order.orderNumber || order.id}
              </span>
            </td>
            <td>
              <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-main);">${customer}</div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-top: 0.2rem; flex-wrap: wrap;">
                ${phone ? `<a href="tel:${phone}" style="color: var(--text-muted); font-size: 0.775rem; text-decoration: none; font-family: 'JetBrains Mono', monospace;">📞 ${phone}</a>` : ''}
                ${whatsapp ? `<a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" style="color: #22c55e; font-size: 0.75rem; font-weight: 700; text-decoration: none;">💬 WhatsApp</a>` : ''}
              </div>
              ${address ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">📍 ${address}</div>` : ''}
              ${order.customerNotes ? `<div style="font-size: 0.725rem; color: #a56319; margin-top: 0.15rem;">📝 ${order.customerNotes}</div>` : ''}
            </td>
            <td>
              <span class="badge" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); font-weight: 600;">
                ${itemsCount} ${i18n.t('items_count')}
              </span>
            </td>
            <td>
              <span style="font-weight: 800; font-size: 0.95rem; color: var(--primary);">${i18n.formatCurrency(total)}</span>
            </td>
            <td>
              <span class="badge ${payBadge}">${translatePayment(payment)}</span>
            </td>
            <td>
              <span class="badge ${badgeClass}">
                <span class="badge-dot"></span>
                ${translateOrderStatus(status)}
              </span>
            </td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
            <td style="text-align: ${isAr ? 'left' : 'right'};">
              <button class="btn btn-secondary btn-sm btn-manage-order" data-id="${order.id}">
                ${i18n.t('view_details')} &rarr;
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-manage-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openOrderDetailDrawer(id, () => loadOrders());
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--danger);">${err.message}</td></tr>`;
      toast.error(err.message);
    }
  }

  function getStatusBadge(status) {
    switch ((status || '').toLowerCase()) {
      case 'pendingconfirmation': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'shipped': return 'badge-shipped';
      case 'delivered': return 'badge-delivered';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-inactive';
    }
  }

  function translateOrderStatus(status) {
    switch ((status || '').toLowerCase()) {
      case 'pendingconfirmation': return i18n.t('pending_confirmation');
      case 'confirmed': return i18n.t('confirmed');
      case 'shipped': return i18n.t('shipped');
      case 'delivered': return i18n.t('delivered');
      case 'cancelled': return i18n.t('cancelled');
      default: return status;
    }
  }

  function translatePayment(pay) {
    switch ((pay || '').toLowerCase()) {
      case 'paid': return i18n.t('paid');
      case 'unpaid': return i18n.t('unpaid');
      case 'refunded': return i18n.t('refunded');
      default: return pay;
    }
  }

  await loadOrders();
}

// Order Details & Operations Drawer
export async function openOrderDetailDrawer(orderId, onUpdateCallback = null) {
  try {
    const order = await api.request(`/api/admin/orders/${orderId}`, { method: 'GET' });
    const isAr = i18n.isRtl();

    const status = order.orderStatus || order.status || 'PendingConfirmation';
    const payment = order.paymentStatus || 'Unpaid';
    const total = order.total ?? order.totalAmount ?? 0;
    const customer = order.customerName || order.customer?.name || (isAr ? 'عميل المتجر' : 'Store Client');
    const phone = order.phoneNumber || order.customer?.phoneNumber || '';
    const whatsapp = order.whatsAppNumber || order.customer?.whatsAppNumber || phone;
    const address = [order.address, order.city, order.governorate].filter(Boolean).join(', ') || (order.shippingAddress || (isAr ? 'لم يحدد عنوان' : 'No address specified'));

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">${i18n.t('order_ref')}</span>
            <div style="font-size: 1.25rem; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: var(--primary);">
              ${order.orderNumber || order.id}
            </div>
          </div>
          <div style="text-align: ${isAr ? 'left' : 'right'};">
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">${i18n.t('date_placed')}</span>
            <div style="font-size: 0.85rem; font-weight: 600;">
              ${i18n.formatDateTime(order.createdAt)}
            </div>
          </div>
        </div>

        <!-- Customer & Delivery Cards -->
        <div class="order-detail-grid">
          <div class="order-detail-card" style="border-inline-start: 4px solid var(--primary);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              👤 ${i18n.t('customer_info')}
            </div>
            <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main);">${customer}</div>
            
            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem;">
              ${phone ? `
                <div style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                  <span>📞</span>
                  <a href="tel:${phone}" style="color: var(--primary); font-family: 'JetBrains Mono', monospace; font-weight: 600; text-decoration: none;">${phone}</a>
                </div>
              ` : `<div style="font-size: 0.8rem; color: var(--text-muted);">${isAr ? 'لا يوجد هاتف مسجل' : 'No phone recorded'}</div>`}

              ${whatsapp ? `
                <div style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                  <span>💬</span>
                  <a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" style="color: #22c55e; font-weight: 700; text-decoration: none;">
                    ${whatsapp} (${isAr ? 'مراسلة واتساب' : 'Open WhatsApp'})
                  </a>
                </div>
              ` : ''}

              ${order.userId ? `
                <div style="font-size: 0.7rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-top: 0.3rem;">
                  ID: ${order.userId}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="order-detail-card" style="border-inline-start: 4px solid var(--secondary);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
              📍 ${i18n.t('shipping_destination')}
            </div>
            <div style="font-size: 0.875rem; color: var(--text-main); line-height: 1.5; font-weight: 500;">
              ${address}
            </div>

            <div style="margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-subtle);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${i18n.t('customer_notes')}:</div>
              <div style="font-size: 0.825rem; color: #a56319; font-style: italic; margin-top: 0.2rem;">
                ${order.customerNotes || i18n.t('no_notes')}
              </div>
            </div>
          </div>
        </div>

        <!-- Line items table -->
        <div>
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem;">
            🛒 ${i18n.t('order_items')} (${order.items?.length || 0})
          </div>
          <div style="background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); padding: 0.5rem 1rem;">
            ${(order.items || []).map(item => {
              const primaryItemTitle = isAr ? (item.productTitleAr || item.productTitleEn) : (item.productTitleEn || item.productTitleAr);
              const secondaryItemTitle = isAr ? (item.productTitleEn !== primaryItemTitle ? item.productTitleEn : '') : (item.productTitleAr !== primaryItemTitle ? item.productTitleAr : '');
              const price = item.unitPrice ?? (item.totalPrice ? item.totalPrice / (item.quantity || 1) : 0);
              const totalItemPrice = item.totalPrice ?? (price * (item.quantity || 1));

              return `
                <div class="order-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-weight: 700; font-size: 0.875rem;">${primaryItemTitle || 'Item'}</div>
                    ${secondaryItemTitle ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${secondaryItemTitle}</div>` : ''}
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                      ${i18n.t('qty')}: ${item.quantity || 1} &bull; ${i18n.t('unit_price')}: ${i18n.formatCurrency(price)}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">
                      ${i18n.formatCurrency(totalItemPrice)}
                    </span>
                    <select class="form-select item-status-select" data-item-id="${item.id}" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                      <option value="Available" ${item.status === 'Available' ? 'selected' : ''}>Available</option>
                      <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Confirmed" ${item.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="Prepared" ${item.status === 'Prepared' ? 'selected' : ''}>Prepared</option>
                      <option value="Shipped" ${item.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    </select>
                  </div>
                </div>
              `;
            }).join('')}

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 0 0.35rem 0; font-weight: 800;">
              <span>${i18n.t('total_amount')}</span>
              <span style="font-size: 1.15rem; color: var(--primary);">${i18n.formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <!-- Status Management Actions -->
        <div class="order-detail-card" style="background: rgba(158, 125, 83, 0.05); border-color: rgba(158, 125, 83, 0.2);">
          <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--primary);">
            ⚡ ${i18n.t('admin_actions')}
          </div>
          
          <div class="form-group">
            <label class="form-label">${i18n.t('update_order_status')}</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="drawer-order-status" class="form-select" style="flex: 1;">
                <option value="PendingConfirmation" ${status === 'PendingConfirmation' ? 'selected' : ''}>${i18n.t('pending_confirmation')}</option>
                <option value="Confirmed" ${status === 'Confirmed' ? 'selected' : ''}>${i18n.t('confirmed')}</option>
                <option value="Shipped" ${status === 'Shipped' ? 'selected' : ''}>${i18n.t('shipped')}</option>
                <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>${i18n.t('delivered')}</option>
                <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>${i18n.t('cancelled')}</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btn-save-order-status">${i18n.t('save_status')}</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${i18n.t('internal_admin_notes')}</label>
            <textarea id="drawer-order-notes" class="form-textarea" placeholder="${isAr ? 'أضف ملاحظات إدارية داخلية...' : 'Add administrative notes...'}">${order.notes || ''}</textarea>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">${i18n.t('update_payment_status')}</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="drawer-payment-status" class="form-select" style="flex: 1;">
                <option value="Unpaid" ${payment === 'Unpaid' ? 'selected' : ''}>${i18n.t('unpaid')}</option>
                <option value="Paid" ${payment === 'Paid' ? 'selected' : ''}>${i18n.t('paid')}</option>
                <option value="Refunded" ${payment === 'Refunded' ? 'selected' : ''}>${i18n.t('refunded')}</option>
              </select>
              <button class="btn btn-secondary btn-sm" id="btn-save-payment-status">${i18n.t('save_payment')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.showDrawer({
      title: `${i18n.t('manage_order')}: ${order.orderNumber || order.id}`,
      contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" type="button" data-drawer-close>${i18n.t('close')}</button>
      `,
      onOpen: (drawer) => {
        const saveStatusBtn = drawer.querySelector('#btn-save-order-status');
        saveStatusBtn.addEventListener('click', async () => {
          const newStatus = drawer.querySelector('#drawer-order-status').value;
          const notes = drawer.querySelector('#drawer-order-notes').value;

          try {
            saveStatusBtn.disabled = true;
            await api.request(`/api/admin/orders/${orderId}/status`, {
              method: 'PATCH',
              body: { status: newStatus, notes }
            });
            toast.success(i18n.t('success'));
            if (onUpdateCallback) onUpdateCallback();
          } catch (err) {
            toast.error(err.message);
          } finally {
            saveStatusBtn.disabled = false;
          }
        });

        const savePaymentBtn = drawer.querySelector('#btn-save-payment-status');
        savePaymentBtn.addEventListener('click', async () => {
          const newPayment = drawer.querySelector('#drawer-payment-status').value;

          try {
            savePaymentBtn.disabled = true;
            await api.request(`/api/admin/orders/${orderId}/payment-status`, {
              method: 'PATCH',
              body: { status: newPayment }
            });
            toast.success(i18n.t('success'));
            if (onUpdateCallback) onUpdateCallback();
          } catch (err) {
            toast.error(err.message);
          } finally {
            savePaymentBtn.disabled = false;
          }
        });

        drawer.querySelectorAll('.item-status-select').forEach(select => {
          select.addEventListener('change', async () => {
            const itemId = select.getAttribute('data-item-id');
            const itemStatus = select.value;

            try {
              await api.request(`/api/admin/orders/${orderId}/items/${itemId}/status`, {
                method: 'PATCH',
                body: { status: itemStatus }
              });
              toast.success(i18n.t('success'));
              if (onUpdateCallback) onUpdateCallback();
            } catch (err) {
              toast.error(err.message);
            }
          });
        });
      }
    });

  } catch (err) {
    toast.error(`Failed to load order detail: ${err.message}`);
  }
}
