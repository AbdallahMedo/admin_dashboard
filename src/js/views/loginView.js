import { enhancePasswordFields } from '../ui/password.js';
import brandLogo from '../../../logo/logo.png';
import { authState } from '../state/authState.js';
import { api } from '../api/client.js';
import { toast } from '../ui/toast.js';

export function renderLoginView(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo"><img src="${brandLogo}" alt="Design & more ? Interiors, Lifestyle, Beyond"></div>
          <h1 class="auth-title">Design & more dashboard</h1>
          <p class="auth-subtitle">Manage your collections, orders, and custom commissions.</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">
              Admin Email <span class="required">*</span>
            </label>
            <input 
              type="email" 
              id="login-email" 
              class="form-control" 
              placeholder="you@example.com" 
              required
              autocomplete="email"
              
            >
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">
              Password <span class="required">*</span>
            </label>
            <input 
              type="password" 
              id="login-password" 
              class="form-control" 
              placeholder="••••••••••••" 
              required
              autocomplete="current-password"
              
            >
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;" id="login-submit-btn">
            <span id="btn-text">Sign In (Live Database)</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </form>

        <div style="margin-top: 1.75rem; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
          <details style="cursor: pointer;">
            <summary style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
              <span>Network / API Host Settings</span>
              <span class="badge badge-active">Render API</span>
            </summary>
            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="backend-url-input">API Base URL (Leave empty for default backend)</label>
                <input 
                  type="text" 
                  id="backend-url-input" 
                  class="form-control" 
                  value="${authState.getBaseUrl()}" 
                  placeholder="https://design-more.onrender.com"
                >
                <span class="form-hint">Leave blank to use the configured Render backend.</span>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-save-api-settings">Save API Host</button>
            </div>
          </details>
        </div>
      </div>
    </div>
  `;

  enhancePasswordFields(container);
  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#login-email');
  const passwordInput = container.querySelector('#login-password');
  const submitBtn = container.querySelector('#login-submit-btn');
  const btnText = container.querySelector('#btn-text');
  const urlInput = container.querySelector('#backend-url-input');
  const saveApiBtn = container.querySelector('#btn-save-api-settings');

  saveApiBtn.addEventListener('click', () => {
    authState.setBaseUrl(urlInput.value.trim());
    toast.success(`API host updated`);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    btnText.textContent = 'Connecting to Database...';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const loginRes = await api.request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true
      });

      authState.setSession(loginRes);

      const me = await api.request('/api/auth/me', { method: 'GET' });
      
      if (me.role !== 'Admin' && me.role !== 'admin') {
        window.location.hash = '#/forbidden';
        return;
      }

      toast.success(`Logged in as ${me.name || me.email} (Role: ${me.role})`);
      window.location.hash = '#/overview';

    } catch (err) {
      toast.error(err.message || 'Authentication failed. Check credentials or backend status.');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Sign In (Live Database)';
    }
  });
}
