import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';
import { openCreateAdminModal } from './createAdminModal.js';

let searchQuery = '';

export async function renderUsersView(container) {
  const isAr = i18n.isRtl();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${i18n.t('users_title')}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${i18n.t('users_subtitle')}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-users">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          ${i18n.t('refresh')}
        </button>
        <button class="btn btn-primary btn-sm" id="btn-provision-new-admin">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
          ${i18n.t('add_admin')}
        </button>
      </div>
    </div>

    <!-- Provision Admin Banner Callout -->
    <div style="background: linear-gradient(135deg, rgba(158, 125, 83, 0.12), rgba(143, 111, 70, 0.08)); border: 1px solid rgba(158, 125, 83, 0.3); border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 42px; height: 42px; border-radius: var(--radius-md); background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-glow);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div>
          <div style="font-weight: 700; font-size: 1rem;">${isAr ? 'إدارة المسؤولين وصلاحيات الفريق' : 'Admin Delegation & Multi-Operator Support'}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">
            ${isAr ? 'يمكن للمسؤول المعتمد إنشاء مسؤولين جدد بصلاحيات كاملة عبر POST /api/admin/users/admins.' : 'Authenticate additional administrators using POST /api/admin/users/admins.'}
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-banner-provision-admin">
        ${i18n.t('add_admin')} &rarr;
      </button>
    </div>

    <!-- Search Box -->
    <div class="filter-toolbar">
      <div class="search-box" style="flex: 1; max-width: 400px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="users-search-input" placeholder="${i18n.t('search_users')}" value="${searchQuery}">
      </div>
    </div>

    <!-- Users Table -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.t('user_name')}</th>
              <th>${i18n.t('user_phone')}</th>
              <th>${i18n.t('user_role')}</th>
              <th>${i18n.t('user_status')}</th>
              <th>${i18n.t('joined_date')}</th>
              <th style="text-align: ${isAr ? 'left' : 'right'};">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr>
              <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                ${i18n.t('loading')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Search filter
  const searchInput = container.querySelector('#users-search-input');
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadUsers();
    }, 250);
  });

  container.querySelector('#btn-refresh-users').addEventListener('click', () => loadUsers());
  container.querySelector('#btn-provision-new-admin').addEventListener('click', () => openCreateAdminModal(() => loadUsers()));
  container.querySelector('#btn-banner-provision-admin').addEventListener('click', () => openCreateAdminModal(() => loadUsers()));

  async function loadUsers() {
    const tbody = container.querySelector('#users-table-body');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">${i18n.t('loading')}</td></tr>`;

    try {
      const users = await api.request('/api/admin/users', {
        method: 'GET',
        params: searchQuery ? { search: searchQuery } : {}
      });

      if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">${i18n.t('no_data')}</td></tr>`;
        return;
      }

      tbody.innerHTML = users.map(user => {
        const isAdmin = user.role === 'Admin' || user.role === 'admin';
        const roleBadge = isAdmin ? 'badge-admin' : 'badge-confirmed';
        const dateStr = i18n.formatDate(user.createdAt);
        const avatarImg = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <img src="${avatarImg}" alt="${user.name}" class="product-avatar-img" style="border-radius: 50%; width: 40px; height: 40px;" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'">
                <div>
                  <div style="font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                    ${user.name}
                    ${isAdmin ? `<span title="${i18n.t('admin_role')}" style="color: var(--primary);">&#x2714;</span>` : ''}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${user.email}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">
                ${user.phoneNumber ? `<a href="tel:${user.phoneNumber}" style="color: inherit; text-decoration: none; font-family: 'JetBrains Mono', monospace;">📞 ${user.phoneNumber}</a>` : '—'}
              </div>
              ${user.whatsAppNumber ? `
                <div style="font-size: 0.75rem; margin-top: 0.15rem;">
                  <a href="https://wa.me/${user.whatsAppNumber.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" style="color: #22c55e; font-weight: 700; text-decoration: none;">💬 WhatsApp</a>
                </div>
              ` : ''}
            </td>
            <td>
              <span class="badge ${roleBadge}">
                ${isAdmin ? i18n.t('admin_role') : i18n.t('client_role')}
              </span>
            </td>
            <td>
              <span class="badge ${user.isBlocked ? 'badge-cancelled' : 'badge-active'}">
                ${user.isBlocked ? (isAr ? 'محظور' : 'Blocked') : (isAr ? 'نشط' : 'Active')}
              </span>
            </td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">
              ${dateStr}
            </td>
            <td style="text-align: ${isAr ? 'left' : 'right'};">
              <div style="display: inline-flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-sm btn-inspect-user" data-id="${user.id}">
                  ${i18n.t('view_details')}
                </button>
                ${!isAdmin ? `
                  <button class="btn ${user.isBlocked ? 'btn-success' : 'btn-danger'} btn-sm btn-toggle-block" data-id="${user.id}" data-blocked="${user.isBlocked}">
                    ${user.isBlocked ? i18n.t('unblock_account') : i18n.t('block_account')}
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-inspect-user').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openUserDetailDrawer(id, () => loadUsers());
        });
      });

      tbody.querySelectorAll('.btn-toggle-block').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const isBlocked = btn.getAttribute('data-blocked') === 'true';
          const endpoint = isBlocked ? `/api/admin/users/${id}/unblock` : `/api/admin/users/${id}/block`;

          try {
            await api.request(endpoint, { method: 'PATCH' });
            toast.success(i18n.t('success'));
            loadUsers();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--danger);">${err.message}</td></tr>`;
      toast.error(err.message);
    }
  }

  await loadUsers();
}

async function openUserDetailDrawer(userId, onUpdateCallback = null) {
  try {
    const [user, orders, reviews] = await Promise.all([
      api.request(`/api/admin/users/${userId}`, { method: 'GET' }),
      api.request(`/api/admin/users/${userId}/orders`, { method: 'GET' }).catch(() => []),
      api.request(`/api/admin/users/${userId}/reviews`, { method: 'GET' }).catch(() => [])
    ]);

    const isAr = i18n.isRtl();

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Header -->
        <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 800;">
            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 1.15rem;">${user.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${user.email}</div>
          </div>
          <span class="badge ${user.role === 'Admin' ? 'badge-admin' : 'badge-confirmed'}">
            ${user.role}
          </span>
        </div>

        <!-- Contact details card -->
        <div class="order-detail-card">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
            📞 ${i18n.t('customer_info')}
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem;">
            <div><strong>${i18n.t('phone_number')}:</strong> ${user.phoneNumber || '—'}</div>
            <div><strong>${i18n.t('whatsapp_number')}:</strong> ${user.whatsAppNumber || '—'}</div>
            <div><strong>${i18n.t('joined_date')}:</strong> ${i18n.formatDate(user.createdAt)}</div>
            <div><strong>${isAr ? 'حالة البريد' : 'Email Verified'}:</strong> ${user.emailVerified ? '✅ ' + (isAr ? 'مؤكد' : 'Verified') : '❌ ' + (isAr ? 'غير مؤكد' : 'Unverified')}</div>
          </div>
        </div>

        <!-- Orders History -->
        <div>
          <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 0.5rem;">
            🛒 ${i18n.t('orders')} (${orders?.length || 0})
          </div>
          <div style="background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); padding: 0.5rem 1rem;">
            ${(orders || []).length === 0 ? `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.8rem;">${i18n.t('no_data')}</div>` :
              orders.map(o => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div>
                    <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.85rem; color: var(--primary);">${o.orderNumber || o.id}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${i18n.formatDate(o.createdAt)} &bull; ${o.orderStatus}</div>
                  </div>
                  <span style="font-weight: 700; font-size: 0.9rem;">${i18n.formatCurrency(o.total)}</span>
                </div>
              `).join('')
            }
          </div>
        </div>

        <!-- Reviews History -->
        <div>
          <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 0.5rem;">
            ⭐ ${i18n.t('reviews_mod')} (${reviews?.length || 0})
          </div>
          <div style="background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); padding: 0.5rem 1rem;">
            ${(reviews || []).length === 0 ? `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.8rem;">${i18n.t('no_data')}</div>` :
              reviews.map(r => `
                <div style="padding: 0.6rem 0; border-bottom: 1px solid var(--border-subtle);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #a56319; font-weight: 700;">★ ${r.rating} / 5</span>
                    <span class="badge ${r.status === 'Approved' ? 'badge-delivered' : 'badge-pending'}" style="font-size: 0.65rem;">${r.status}</span>
                  </div>
                  <div style="font-size: 0.8rem; margin-top: 0.3rem; color: var(--text-secondary);">${r.comment || ''}</div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;

    modal.showDrawer({
      title: `${isAr ? 'ملف المستخدم' : 'User Profile'}: ${user.name}`,
      contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" type="button" data-drawer-close>${i18n.t('close')}</button>
      `
    });

  } catch (err) {
    toast.error(err.message);
  }
}
