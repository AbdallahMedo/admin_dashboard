// Reusable Modal & Slide-out Drawer Controller

class ModalController {
  constructor() {
    this.activeModal = null;
    this.activeDrawer = null;
    this.bindGlobalKeys();
  }

  bindGlobalKeys() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.activeModal) this.closeModal();
        if (this.activeDrawer) this.closeDrawer();
      }
    });
  }

  showModal({ title, contentHtml, footerHtml = '', size = 'md', onOpen = null }) {
    this.closeModal();

    let overlay = document.getElementById('global-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    const sizeClass = size === 'lg' ? 'modal-lg' : (size === 'xl' ? 'modal-xl' : '');

    overlay.innerHTML = `
      <div class="modal-dialog ${sizeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-ghost btn-icon modal-close" id="modal-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" id="modal-body-container">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    overlay.classList.add('active');
    this.activeModal = overlay;

    // Close handlers
    const closeBtn = overlay.querySelector('#modal-close-btn');
    closeBtn.addEventListener('click', () => this.closeModal());
    overlay.onclick = (e) => {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) this.closeModal();
    };

    if (onOpen) onOpen(overlay);
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.classList.remove('active');
      this.activeModal = null;
    }
  }

  showDrawer({ title, contentHtml, footerHtml = '', onOpen = null }) {
    this.closeDrawer();

    let drawerOverlay = document.getElementById('global-drawer-overlay');
    if (!drawerOverlay) {
      drawerOverlay = document.createElement('div');
      drawerOverlay.id = 'global-drawer-overlay';
      drawerOverlay.className = 'modal-overlay';
      document.body.appendChild(drawerOverlay);
    }

    drawerOverlay.innerHTML = `
      <div class="drawer" id="global-slide-drawer">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn-ghost btn-icon drawer-close" id="drawer-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" id="drawer-body-container">
          ${contentHtml}
        </div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>
    `;

    drawerOverlay.classList.add('active');
    const drawerEl = drawerOverlay.querySelector('#global-slide-drawer');
    setTimeout(() => drawerEl.classList.add('open'), 10);
    this.activeDrawer = drawerOverlay;

    const closeBtn = drawerOverlay.querySelector('#drawer-close-btn');
    closeBtn.addEventListener('click', () => this.closeDrawer());
    drawerOverlay.onclick = (e) => {
      if (e.target === drawerOverlay || e.target.closest('[data-drawer-close]')) this.closeDrawer();
    };

    if (onOpen) onOpen(drawerOverlay);
  }

  closeDrawer() {
    if (this.activeDrawer) {
      const drawerEl = this.activeDrawer.querySelector('#global-slide-drawer');
      if (drawerEl) drawerEl.classList.remove('open');
      setTimeout(() => {
        if (this.activeDrawer) {
          this.activeDrawer.classList.remove('active');
          this.activeDrawer = null;
        }
      }, 300);
    }
  }
}

export const modal = new ModalController();
