import brandLogo from '../../logo/logo.png';
import { authState } from './state/authState.js';
import { api } from './api/client.js';
import { toast } from './ui/toast.js';
import { modal } from './ui/modal.js';
import { i18n } from './i18n.js';
import { openCreateAdminModal } from './views/createAdminModal.js';

import { renderMessagesView, refreshMessagesBadge } from './views/messagesView.js';

// Page Views
import { renderLoginView } from './views/loginView.js';
import { renderForbiddenView } from './views/forbiddenView.js';
import { renderOverviewView } from './views/overviewView.js';
import { renderOrdersView } from './views/ordersView.js';
import { renderProductsView } from './views/productsView.js';
import { renderCategoriesView } from './views/categoriesView.js';
import { renderDeliveryFeesView } from './views/deliveryFeesView.js';
import { renderReviewsView } from './views/reviewsView.js';
import { renderCustomOrdersView } from './views/customOrdersView.js';
import { renderAdsView } from './views/adsView.js';
import { renderUsersView } from './views/usersView.js';
import { renderApiExplorerView } from './views/apiExplorerView.js';

const routes = {
  '#/messages': { titleKey: 'messages', view: renderMessagesView },
  '#/delivery-fees': { titleKey: 'delivery_fees', view: renderDeliveryFeesView },
  '#/login': { titleKey: 'logout', view: renderLoginView, public: true },
  '#/forbidden': { titleKey: 'error', view: renderForbiddenView, public: true },
  '#/overview': { titleKey: 'overview', breadcrumb: 'Dashboard > Analytics', view: renderOverviewView },
  '#/orders': { titleKey: 'orders', breadcrumb: 'Commerce > Orders', view: renderOrdersView },
  '#/products': { titleKey: 'products_stock', breadcrumb: 'Catalog > Products', view: renderProductsView },
  '#/categories': { titleKey: 'categories', breadcrumb: 'Catalog > Categories', view: renderCategoriesView },
  '#/reviews': { titleKey: 'reviews_mod', breadcrumb: 'Community > Reviews', view: renderReviewsView },
  '#/custom-orders': { titleKey: 'custom_orders', breadcrumb: 'Bespoke > Requests', view: renderCustomOrdersView },
  '#/advertisements': { titleKey: 'advertisements', breadcrumb: 'Marketing > Banners', view: renderAdsView },
  '#/users': { titleKey: 'users_admins', breadcrumb: 'Access > Directory', view: renderUsersView },
  '#/api-explorer': { titleKey: 'api_explorer', breadcrumb: 'Developer > API Explorer', view: renderApiExplorerView }
};

class Application {
  constructor() {
    this.appRoot = document.getElementById('app');
    this.currentTheme = localStorage.getItem('design_more_theme') || 'light';
    document.documentElement.setAttribute('data-theme', this.currentTheme);

    // Subscribe to i18n changes
    i18n.subscribe(() => {
      this.renderDashboardShell();
      this.handleRouting();
    });

    this.init();
    setInterval(() => {
      if (authState.isAuthenticated() && authState.isAdmin() && this.appRoot.querySelector('.sidebar')) refreshMessagesBadge();
    }, 30000);
  }

  async init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    authState.subscribe(() => this.updateHeaderEnvStatus());

    // Startup Session Verification per ADMIN_DASHBOARD_FRONTEND.md:
    // If token is absent or expired, call POST /api/auth/refresh with { refreshToken }
    if (authState.refreshToken && (authState.isTokenExpired() || !authState.accessToken)) {
      try {
        await api.refreshToken();
      } catch (err) {
        authState.clearSession();
      }
    }

    // Default route
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = authState.isAuthenticated() ? '#/overview' : '#/login';
    } else {
      this.handleRouting();
    }
  }

  async handleRouting() {
    const hash = window.location.hash || '#/login';
    const route = routes[hash] || routes['#/overview'];

    // Auth Protection
    if (!route.public) {
      if (!authState.isAuthenticated()) {
        window.location.hash = '#/login';
        return;
      }

      // Check role verification (only render Admin dashboard when role is Admin)
      if (!authState.isAdmin()) {
        window.location.hash = '#/forbidden';
        return;
      }
    }

    if (hash === '#/login' || hash === '#/forbidden') {
      route.view(this.appRoot);
      return;
    }

    // Render Dashboard Shell if not already mounted
    if (!this.appRoot.querySelector('.sidebar')) {
      this.renderDashboardShell();
    }

    // Update active nav link
    this.appRoot.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === hash);
    });

    // Update Topbar titles
    const pageTitleEl = document.getElementById('topbar-title');
    const breadcrumbsEl = document.getElementById('topbar-breadcrumbs');
    if (pageTitleEl) pageTitleEl.textContent = i18n.t(route.titleKey);
    if (breadcrumbsEl) breadcrumbsEl.textContent = i18n.isRtl() ? `لوحة التحكم > ${i18n.t(route.titleKey)}` : `Dashboard > ${i18n.t(route.titleKey)}`;

    // Render View in page-content container
    const contentContainer = document.getElementById('page-content');
    if (contentContainer) {
      contentContainer.innerHTML = '';
      await route.view(contentContainer);
    }
  }

  renderDashboardShell() {
    const user = authState.user || { name: 'Super Administrator', role: 'Admin', email: 'admin@example.com' };
    const isMock = authState.isMockMode();
    const isAr = i18n.isRtl();

    this.appRoot.innerHTML = `
      <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-header">
            <a href="#/overview" class="brand-logo">
              <div class="brand-badge"><img src="${brandLogo}" alt="Design & more logo"></div>
              <div class="brand-text">
                <span class="brand-name">${i18n.t('brand_name')}</span>
                <span class="brand-tag">${i18n.t('brand_tag')}</span>
              </div>
            </a>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-title">${i18n.t('core_management')}</div>
            <a href="#/overview" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>${i18n.t('overview')}</span>
            </a>
            <a href="#/orders" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span>${i18n.t('orders')}</span>
              <span class="nav-badge" id="sidebar-orders-badge">${i18n.t('active')}</span>
            </a>
            <a href="#/delivery-fees" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h12v12H3zM15 10h4l3 4v4h-7"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>
              <span>${i18n.t('delivery_fees')}</span>
            </a>
            <a href="#/messages" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>
              <span>${i18n.t('messages')}</span>
              <span class="nav-badge" id="sidebar-messages-badge" aria-live="polite" hidden></span>
            </a>
            <a href="#/custom-orders" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>${i18n.t('custom_orders')}</span>
              <span class="nav-badge" style="background: rgba(166, 99, 25, 0.2); color: var(--warning);">VIP</span>
            </a>

            <div class="nav-section-title">${i18n.t('catalog_store')}</div>
            <a href="#/products" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>${i18n.t('products_stock')}</span>
            </a>
            <a href="#/categories" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>${i18n.t('categories')}</span>
            </a>
            <a href="#/reviews" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${i18n.t('reviews_mod')}</span>
            </a>
            <a href="#/advertisements" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
              </svg>
              <span>${i18n.t('advertisements')}</span>
            </a>

            <div class="nav-section-title">${i18n.t('access_system')}</div>
            <a href="#/users" class="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>${i18n.t('users_admins')}</span>
            </a>
            <a href="#/api-explorer" class="nav-item" style="color: var(--primary);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <span style="font-weight: 700;">${i18n.t('api_explorer')}</span>
              <span class="nav-badge" style="background: rgba(158, 125, 83, 0.2); color: var(--primary);">28+</span>
            </a>
          </nav>

          <!-- Sidebar Footer with User Session & Mode -->
          <div class="sidebar-footer">
            <div class="env-indicator-card" id="sidebar-env-card">
              <span style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="env-status-dot" id="env-dot" style="background-color: var(--success); box-shadow: 0 0 8px var(--success);"></span>
                <span id="env-label" style="font-weight: 700; font-size: 0.75rem; color: var(--success);">${i18n.t('live_db_connected')}</span>
              </span>
              <span class="badge badge-active" style="font-size: 0.65rem;">Live</span>
            </div>

            <div class="sidebar-user">
              <div class="user-avatar">${user.name ? user.name.charAt(0).toUpperCase() : 'A'}</div>
              <div class="user-info">
                <div class="user-name">${user.name || 'Admin'}</div>
                <div class="user-role">${user.role === 'Admin' ? i18n.t('admin_role') : (user.role || 'Admin')}</div>
              </div>
              <button class="btn-logout" id="btn-sidebar-logout" title="${i18n.t('logout')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Wrapper -->
        <div class="main-wrapper">
          <header class="topbar">
            <div class="topbar-left">
              <button class="btn btn-ghost btn-icon" id="btn-toggle-sidebar" aria-label="Toggle navigation" aria-controls="app-sidebar" aria-expanded="false">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <div class="topbar-title-group">
                <h1 class="topbar-page-title" id="topbar-title">${i18n.t('overview')}</h1>
                <span class="topbar-breadcrumbs" id="topbar-breadcrumbs">${isAr ? 'لوحة التحكم > نظرة عامة' : 'Dashboard > Overview'}</span>
              </div>
            </div>

            <div class="topbar-right">
              <!-- Dual Language Switcher Button (AR & EN) -->
              <button class="lang-toggle-btn" id="btn-lang-toggle" title="${isAr ? 'Switch to English' : 'التبديل إلى العربية'}">
                <span style="font-size: 1.1rem; line-height: 1;">${isAr ? '🇬🇧' : '🇸🇦'}</span>
                <span style="font-size: 0.85rem; font-weight: 700;">${i18n.t('lang_name')} (${i18n.t('lang_code')})</span>
              </button>

              <!-- Quick Action: Provision Admin Button -->
              <button class="btn btn-primary btn-sm" id="btn-topbar-new-admin" title="${i18n.t('quick_admin')}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
                ${i18n.t('quick_admin')}
              </button>

              <!-- Dark/Light Mode Switcher -->
              <button class="btn btn-secondary btn-icon" id="btn-theme-toggle" title="${i18n.t('toggle_theme')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </button>

              <!-- API Configuration Shortcut -->
              <button class="btn btn-secondary btn-icon" id="btn-topbar-api-settings" title="${i18n.t('api_settings')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
          </header>

          <main class="page-content" id="page-content"></main>
        </div>
      </div>
    `;

    // Hook Shell Events
    this.hookShellEvents();
    refreshMessagesBadge();
  }

  hookShellEvents() {
    // Language Toggle
    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        i18n.toggleLanguage();
        toast.info(i18n.isRtl() ? 'تم التحويل إلى اللغة العربية' : 'Switched language to English');
      });
    }

    // Topbar New Admin action
    const newAdminBtn = document.getElementById('btn-topbar-new-admin');
    if (newAdminBtn) {
      newAdminBtn.addEventListener('click', () => openCreateAdminModal());
    }

    const sidebarToggle = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('app-sidebar');
    sidebarToggle.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      sidebarToggle.setAttribute('aria-expanded', String(open));
    });
    sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }));

    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('design_more_theme', this.currentTheme);
        toast.info(`Switched to ${this.currentTheme} theme`);
      });
    }

    // API settings modal shortcut
    const apiBtn = document.getElementById('btn-topbar-api-settings');
    if (apiBtn) {
      apiBtn.addEventListener('click', () => this.openApiConfigModal());
    }

    // Logout Routine: POST /api/auth/logout with refreshToken, then clear session
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          if (authState.refreshToken) {
            await api.request('/api/auth/logout', {
              method: 'POST',
              body: { refreshToken: authState.refreshToken }
            });
          }
        } catch (e) {
          // ignore error on logout
        } finally {
          authState.clearSession();
          toast.info(i18n.isRtl() ? 'تم تسجيل الخروج بأمان' : 'Logged out securely');
          window.location.hash = '#/login';
        }
      });
    }
  }

  updateHeaderEnvStatus() {
    const dot = document.getElementById('env-dot');
    const label = document.getElementById('env-label');
    if (dot && label) {
      dot.className = 'env-status-dot';
      dot.style.backgroundColor = 'var(--success)';
      dot.style.boxShadow = '0 0 8px var(--success)';
      label.textContent = i18n.t('live_db_connected');
    }
  }

  openApiConfigModal() {
    modal.showModal({
      title: i18n.isRtl() ? 'إعدادات الاتصال بالسيرفر والوضع الافتراضي' : 'API Server & Mode Settings',
      contentHtml: `
        <div class="form-group">
          <label class="form-label">${i18n.isRtl() ? 'عنوان السيرفر الفعّال (API Host URL)' : 'Active Backend Host URL'}</label>
          <input type="text" id="cfg-base-url" class="form-control" value="${authState.getBaseUrl()}">
          <span class="form-hint">${i18n.isRtl() ? 'اتركه فارغاً لاستخدام خادم Render الافتراضي' : 'https://design-more.onrender.com — leave empty to restore the default backend'}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-surface-elevated); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem;">
          <div>
            <div style="font-weight: 700; font-size: 0.9rem;">${i18n.isRtl() ? 'تفعيل الوضع التجريبي الافتراضي (Demo Mock)' : 'Enable Demo / Mock Data Engine'}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${i18n.isRtl() ? 'محاكاة لجميع الـ 28+ واجهة برمجية داخل المتصفح.' : 'Simulates all 28+ Admin endpoints in-memory without network dependencies.'}
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" id="cfg-mock-mode" ${authState.isMockMode() ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary" onclick="modal.closeModal()">${i18n.t('cancel')}</button>
        <button class="btn btn-primary" id="btn-save-cfg">${i18n.t('save')}</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelector('#btn-save-cfg').addEventListener('click', () => {
          const url = modalEl.querySelector('#cfg-base-url').value.trim();
          const mock = modalEl.querySelector('#cfg-mock-mode').checked;
          authState.setBaseUrl(url);
          authState.setMockMode(mock);
          toast.success(i18n.isRtl() ? 'تم حفظ إعدادات الاتصال بنجاح' : 'API configuration updated');
          modal.closeModal();
          this.handleRouting();
        });
      }
    });
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  new Application();
});
