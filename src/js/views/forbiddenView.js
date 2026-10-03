import { authState } from '../state/authState.js';

export function renderForbiddenView(container) {
  container.innerHTML = `
    <div class="forbidden-container">
      <div class="forbidden-icon">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em;">403 - Forbidden</h1>
      <p style="color: var(--text-secondary); max-width: 480px; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">
        You are authenticated, but your account does not possess the required <strong>Admin</strong> privileges to view this management console.
      </p>
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary" id="btn-forbidden-logout">
          Sign Out & Switch Account
        </button>
        <a href="#/login" class="btn btn-primary">
          Return to Login
        </a>
      </div>
    </div>
  `;

  const logoutBtn = container.querySelector('#btn-forbidden-logout');
  logoutBtn.addEventListener('click', () => {
    authState.clearSession();
    window.location.hash = '#/login';
  });
}
