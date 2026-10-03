import { api } from '../api/client.js';
import { renderRevenueTimelineChart } from '../ui/charts.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';
import { i18n } from '../i18n.js';
import { openCreateAdminModal } from './createAdminModal.js';
import { openOrderDetailDrawer } from './ordersView.js';

export async function renderOverviewView(container) {
  const isAr = i18n.isRtl();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${i18n.t('overview')}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${isAr ? 'بيانات حية مباشرة من قاعدة بيانات سيرفر MechanicalDesigns.' : 'Live production data queried from MechanicalDesigns database.'}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-overview">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          ${i18n.t('refresh')}
        </button>
        <button class="btn btn-primary btn-sm" id="btn-quick-admin">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          ${i18n.t('quick_admin')}
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <div class="stats-grid" id="kpi-cards-container">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_revenue')}</span>
          <div class="stat-icon emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-revenue">--</div>
        <div class="stat-trend up" id="kpi-revenue-trend">${isAr ? 'الطلبات المسلمة والمدفوعة' : 'Delivered & Paid'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_orders')}</span>
          <div class="stat-icon indigo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-orders">--</div>
        <div class="stat-trend up" id="kpi-orders-trend">${isAr ? 'في قاعدة البيانات' : 'In Database'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_customers')}</span>
          <div class="stat-icon sky">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-customers">--</div>
        <div class="stat-trend up" id="kpi-customers-trend">${isAr ? 'حسابات العملاء' : 'Client Accounts'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_products')}</span>
          <div class="stat-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-products">--</div>
        <div class="stat-trend up" id="kpi-products-trend">${isAr ? 'الكتالوج النشط' : 'Live Inventory'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_custom_orders')}</span>
          <div class="stat-icon amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-custom-orders">--</div>
        <div class="stat-trend up" id="kpi-custom-orders-trend">${isAr ? 'طلبات مخصصة' : 'Bespoke Requests'}</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">${i18n.t('kpi_avg_rating')}</span>
          <div class="stat-icon rose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="kpi-reviews">--</div>
        <div class="stat-trend up" id="kpi-reviews-trend">${isAr ? 'تقييمات المستخدمين' : 'User Feedback'}</div>
      </div>
    </div>

    <!-- Revenue Timeline Chart & Best Selling Products Split -->
    <div class="overview-grid-split">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${isAr ? 'توزيع حالات الطلبات' : 'Order Status Breakdown'}</div>
            <div class="card-subtitle">${isAr ? 'إحصائيات مباشرة من مراحل التنفيذ' : 'Real-time counts across pipeline stages'}</div>
          </div>
          <span class="badge badge-active">${isAr ? 'بيانات حقيقية' : 'Actual Data'}</span>
        </div>
        <div class="card-body">
          <div class="chart-wrapper">
            <canvas id="revenue-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${i18n.t('best_sellers_title')}</div>
            <div class="card-subtitle">${isAr ? 'الأعلى مبيعاً في المتجر' : 'Top revenue generators'}</div>
          </div>
          <a href="#/products" class="btn btn-ghost btn-sm" style="color: var(--primary);">${i18n.t('view_all_orders')}</a>
        </div>
        <div class="card-body" id="best-sellers-list" style="padding-top: 0.5rem;">
          <div style="text-align: center; padding: 2rem; color: var(--text-muted);">${i18n.t('loading')}</div>
        </div>
      </div>
    </div>

    <!-- Recent 10 Orders Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${i18n.t('recent_orders_title')}</div>
          <div class="card-subtitle">${isAr ? 'أحدث المعاملات المسجلة بقاعدة البيانات' : 'Recent transactions from database'}</div>
        </div>
        <a href="#/orders" class="btn btn-secondary btn-sm">${i18n.t('all_orders')}</a>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.t('order_ref')}</th>
              <th>${i18n.t('customer')}</th>
              <th>${i18n.t('total_amount')}</th>
              <th>${i18n.t('fulfillment_status')}</th>
              <th>${i18n.t('date')}</th>
              <th style="text-align: ${isAr ? 'left' : 'right'};">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="recent-orders-tbody">
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                ${i18n.t('loading')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Hook up buttons
  container.querySelector('#btn-refresh-overview').addEventListener('click', () => loadDashboardData());
  container.querySelector('#btn-quick-admin').addEventListener('click', () => {
    openCreateAdminModal();
  });

  async function loadDashboardData() {
    try {
      await api.request('/api/admin/authorization-check', { method: 'GET' });

      const [overviewData, recentOrders, bestSellers] = await Promise.all([
        api.request('/api/admin/dashboard/overview', { method: 'GET' }),
        api.request('/api/admin/dashboard/recent-orders', { method: 'GET' }),
        api.request('/api/admin/dashboard/best-selling-products', { method: 'GET' })
      ]);

      if (overviewData) {
        const totalRevenue = overviewData.totalRevenue ?? 0;
        const totalOrders = overviewData.totalOrders ?? 0;
        const totalCustomers = overviewData.totalCustomers ?? 0;
        const totalProducts = overviewData.totalProducts ?? 0;
        const customOrders = overviewData.customOrdersCount ?? 0;
        const reviews = overviewData.reviewsCount ?? 0;

        container.querySelector('#kpi-revenue').textContent = i18n.formatCurrency(totalRevenue);
        container.querySelector('#kpi-orders').textContent = Number(totalOrders).toLocaleString();
        container.querySelector('#kpi-customers').textContent = Number(totalCustomers).toLocaleString();
        container.querySelector('#kpi-products').textContent = Number(totalProducts).toLocaleString();
        container.querySelector('#kpi-custom-orders').textContent = Number(customOrders).toLocaleString();
        container.querySelector('#kpi-reviews').textContent = Number(reviews).toLocaleString();

        // Chart breakdown
        const pipelineData = [
          { month: isAr ? 'قيد الانتظار' : 'Pending', revenue: overviewData.pendingOrders ?? 0 },
          { month: isAr ? 'مؤكد' : 'Confirmed', revenue: overviewData.confirmedOrders ?? 0 },
          { month: isAr ? 'تم التوصيل' : 'Delivered', revenue: overviewData.deliveredOrders ?? 0 },
          { month: isAr ? 'ملغي' : 'Cancelled', revenue: overviewData.cancelledOrders ?? 0 }
        ];
        renderRevenueTimelineChart('revenue-chart', pipelineData);
      }

      // Render Best Sellers
      const bestSellersContainer = container.querySelector('#best-sellers-list');
      if (bestSellers && bestSellers.length > 0) {
        bestSellersContainer.innerHTML = bestSellers.map((item, idx) => {
          const title = isAr ? (item.productTitleAr || item.productTitleEn) : (item.productTitleEn || item.productTitleAr);
          const sold = item.quantitySold ?? item.salesCount ?? 0;
          const rev = item.revenue ?? 0;
          return `
            <div class="best-seller-item">
              <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-muted); width: 22px;">#${idx + 1}</span>
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary);">
                ${title.charAt(0).toUpperCase()}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${title}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                  ${sold} ${i18n.t('sold')} &bull; ${i18n.formatCurrency(rev)}
                </div>
              </div>
              <span class="badge badge-active" style="font-size: 0.7rem;">${i18n.t('active')}</span>
            </div>
          `;
        }).join('');
      } else {
        bestSellersContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1.5rem;">${i18n.t('no_data')}</div>`;
      }

      // Render Recent Orders from real backend
      const tbody = container.querySelector('#recent-orders-tbody');
      if (recentOrders && recentOrders.length > 0) {
        tbody.innerHTML = recentOrders.map(order => {
          const status = order.orderStatus || order.status || 'PendingConfirmation';
          const statusClass = getStatusBadgeClass(status);
          const dateStr = i18n.formatDateTime(order.createdAt);
          const customer = order.customerName || (isAr ? 'عميل المتجر' : 'Store Client');
          const totalVal = order.total ?? 0;

          return `
            <tr>
              <td>
                <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: var(--primary);">
                  ${order.orderNumber || order.id}
                </span>
              </td>
              <td>
                <div style="font-weight: 700;">${customer}</div>
              </td>
              <td>
                <span style="font-weight: 800; color: var(--text-main);">${i18n.formatCurrency(totalVal)}</span>
              </td>
              <td>
                <span class="badge ${statusClass}">
                  <span class="badge-dot"></span>
                  ${translateStatus(status)}
                </span>
              </td>
              <td style="color: var(--text-muted); font-size: 0.775rem;">
                ${dateStr}
              </td>
              <td style="text-align: ${isAr ? 'left' : 'right'};">
                <button class="btn btn-secondary btn-sm btn-view-order" data-id="${order.id}">
                  ${i18n.t('view_details')} &rarr;
                </button>
              </td>
            </tr>
          `;
        }).join('');

        tbody.querySelectorAll('.btn-view-order').forEach(btn => {
          btn.addEventListener('click', () => {
            const orderId = btn.getAttribute('data-id');
            openOrderDetailDrawer(orderId, () => loadDashboardData());
          });
        });
      } else {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">${i18n.t('no_data')}</td></tr>`;
      }

    } catch (err) {
      toast.error(err.message);
    }
  }

  function getStatusBadgeClass(status) {
    const s = String(status).toLowerCase();
    if (s === '0' || s.includes('pending')) return 'badge-pending';
    if (s === '1' || s.includes('confirmed')) return 'badge-confirmed';
    if (s === '2' || s.includes('shipped')) return 'badge-shipped';
    if (s === '3' || s.includes('delivered')) return 'badge-delivered';
    if (s === '4' || s.includes('cancelled')) return 'badge-cancelled';
    return 'badge-inactive';
  }

  function translateStatus(status) {
    const s = String(status).toLowerCase();
    if (s === '0' || s.includes('pending')) return i18n.t('pending_confirmation');
    if (s === '1' || s.includes('confirmed')) return i18n.t('confirmed');
    if (s === '2' || s.includes('shipped')) return i18n.t('shipped');
    if (s === '3' || s.includes('delivered')) return i18n.t('delivered');
    if (s === '4' || s.includes('cancelled')) return i18n.t('cancelled');
    return status;
  }

  await loadDashboardData();
}
