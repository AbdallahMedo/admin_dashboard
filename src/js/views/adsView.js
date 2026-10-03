import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';

export async function renderAdsView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Promotions & Advertisements</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Deploy hero banners, promotional carousels, and landing announcements.
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-ads">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" id="btn-add-ad">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          + Deploy Banner
        </button>
      </div>
    </div>

    <!-- Advertisements Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;" id="ads-container">
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); grid-column: 1/-1;">
        Loading advertisement campaigns...
      </div>
    </div>
  `;

  container.querySelector('#btn-refresh-ads').addEventListener('click', () => loadAds());
  container.querySelector('#btn-add-ad').addEventListener('click', () => openCreateAdModal(() => loadAds()));

  async function loadAds() {
    const grid = container.querySelector('#ads-container');
    grid.innerHTML = `<div style="text-align: center; padding: 3rem; color: var(--text-muted); grid-column: 1/-1;">Loading banners...</div>`;

    try {
      const result = await api.request('/api/admin/advertisements', { method: 'GET' });
      const ads = result?.map(ad => ({ ...ad, title: ad.titleEn || ad.titleAr || ad.title || '' }));

      if (!ads || ads.length === 0) {
        grid.innerHTML = `<div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted); grid-column: 1/-1;">No promotional advertisements deployed.</div>`;
        return;
      }

      grid.innerHTML = ads.map(ad => `
        <div class="card" style="display: flex; flex-direction: column; overflow: hidden;">
          <div style="position: relative; aspect-ratio: 16/9; background: var(--bg-surface-elevated); border-bottom: 1px solid var(--border-subtle);">
            <img src="${ad.imageUrl}" alt="${ad.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'">
            <span class="badge" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: white;">
              ${ad.position || 'Hero'}
            </span>
          </div>

          <div style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem;">
                <h3 style="font-weight: 700; font-size: 1rem; line-height: 1.3;">${ad.title}</h3>
                <label class="switch" title="Toggle active status">
                  <input type="checkbox" class="ad-status-toggle" data-id="${ad.id}" ${ad.isActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div style="font-size: 0.775rem; color: var(--text-muted); word-break: break-all; margin-bottom: 0.75rem;">
                Target: <span style="color: var(--primary); font-family: 'JetBrains Mono', monospace;">${ad.linkUrl}</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; pt-2; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; margin-top: 0.75rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">
                ${ad.clicks || 0} engagements
              </span>
              <div style="display: inline-flex; gap: 0.35rem;">
                <button class="btn btn-secondary btn-sm btn-edit-ad" data-id="${ad.id}">Edit</button>
                <button class="btn btn-danger btn-sm btn-delete-ad" data-id="${ad.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Status toggle (PATCH /api/admin/advertisements/{id}/status)
      grid.querySelectorAll('.ad-status-toggle').forEach(toggle => {
        toggle.addEventListener('change', async () => {
          const id = toggle.getAttribute('data-id');
          const isActive = toggle.checked;
          try {
            await api.request(`/api/admin/advertisements/${id}/status`, {
              method: 'PATCH',
              body: { isActive }
            });
            toast.success(`Banner status updated to ${isActive ? 'Active' : 'Inactive'}`);
          } catch (err) {
            toast.error(err.message);
            toggle.checked = !isActive;
          }
        });
      });

      // Edit Ad (PUT /api/admin/advertisements/{id})
      grid.querySelectorAll('.btn-edit-ad').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const ad = ads.find(a => a.id === id);
          if (ad) openEditAdModal(ad, () => loadAds());
        });
      });

      // Delete Ad (DELETE /api/admin/advertisements/{id})
      grid.querySelectorAll('.btn-delete-ad').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openDeleteAdModal(id, () => loadAds());
        });
      });

    } catch (err) {
      toast.error(`Failed to load ads: ${err.message}`);
    }
  }

  await loadAds();
}

function openCreateAdModal(onSuccess) {
  modal.showModal({
    title: '+ Deploy New Advertisement',
    contentHtml: `
      <form id="create-ad-form">
        <div class="form-group">
          <label class="form-label">Campaign Title (English) <span class="required">*</span></label>
          <input type="text" id="new-ad-title" class="form-control" placeholder="e.g. Autumn High Horology Exhibition" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-ad-title-ar">Campaign Title (Arabic) <span class="required">*</span></label>
          <input type="text" id="new-ad-title-ar" class="form-control" dir="rtl" lang="ar" required>
        </div>
        <div class="form-group">
          <label class="form-label">Banner Image URL <span class="required">*</span></label>
          <input type="url" id="new-ad-image" class="form-control" value="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200" required>
        </div>
        <div class="form-group">
          <label class="form-label">Destination URL</label>
          <input type="text" id="new-ad-link" class="form-control" placeholder="/promotions/exhibition" value="/promotions/exhibition">
        </div>
        <div class="form-group">
          <label class="form-label">Placement Position</label>
          <select id="new-ad-position" class="form-select">
            <option value="HeroBanner">Hero Banner</option>
            <option value="MidPageBanner">Mid-Page Banner</option>
            <option value="FooterBanner">Footer Banner</option>
            <option value="SidebarPopup">Sidebar Promo</option>
          </select>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
          <span style="font-size: 0.85rem; font-weight: 600;">Active immediately</span>
          <label class="switch">
            <input type="checkbox" id="new-ad-active" checked>
            <span class="slider"></span>
          </label>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="btn-submit-create-ad">Deploy Banner</button>
    `,
    onOpen: (modalEl) => {
      const submitBtn = modalEl.querySelector('#btn-submit-create-ad');
      submitBtn.addEventListener('click', async () => {
        const titleEn = modalEl.querySelector('#new-ad-title').value.trim();
        const titleAr = modalEl.querySelector('#new-ad-title-ar').value.trim();
        const imageUrl = modalEl.querySelector('#new-ad-image').value.trim();
        const linkUrl = modalEl.querySelector('#new-ad-link').value.trim();
        const position = modalEl.querySelector('#new-ad-position').value;
        const isActive = modalEl.querySelector('#new-ad-active').checked;

        if (!titleEn || !titleAr || !imageUrl) {
          toast.warning('English title, Arabic title, and Image URL are required');
          return;
        }

        try {
          submitBtn.disabled = true;
          await api.request('/api/admin/advertisements', {
            method: 'POST',
            body: { titleAr, titleEn, imageUrl, linkUrl, position, isActive }
          });
          toast.success(`Banner '${titleEn}' deployed`);
          modal.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error(err.message);
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  });
}

function openEditAdModal(ad, onSuccess) {
  modal.showModal({
    title: `Edit Banner: ${ad.title}`,
    contentHtml: `
      <form id="edit-ad-form">
        <div class="form-group">
          <label class="form-label">Campaign Title (English) <span class="required">*</span></label>
          <input type="text" id="edit-ad-title" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-ad-title-ar">Campaign Title (Arabic) <span class="required">*</span></label>
          <input type="text" id="edit-ad-title-ar" class="form-control" dir="rtl" lang="ar" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="edit-ad-image">Banner Image URL <span class="required">*</span></label>
          <input type="url" id="edit-ad-image" class="form-control" required>
        </div>
        <div class="form-group">
          <label class="form-label">Destination URL</label>
          <input type="text" id="edit-ad-link" class="form-control" value="${ad.linkUrl || ''}">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="btn-submit-edit-ad">Save Changes</button>
    `,
    onOpen: (modalEl) => {
      modalEl.querySelector('#edit-ad-title').value = ad.titleEn || ad.title || '';
      modalEl.querySelector('#edit-ad-title-ar').value = ad.titleAr || '';
      modalEl.querySelector('#edit-ad-image').value = ad.imageUrl || '';
      const submitBtn = modalEl.querySelector('#btn-submit-edit-ad');
      submitBtn.addEventListener('click', async () => {
        const titleEn = modalEl.querySelector('#edit-ad-title').value.trim();
        const titleAr = modalEl.querySelector('#edit-ad-title-ar').value.trim();
        const imageUrl = modalEl.querySelector('#edit-ad-image').value.trim();
        const linkUrl = modalEl.querySelector('#edit-ad-link').value.trim();
        if (!titleEn || !titleAr || !imageUrl) {
          toast.warning('English title, Arabic title, and Image URL are required');
          return;
        }
        try {
          submitBtn.disabled = true;
          await api.request(`/api/admin/advertisements/${ad.id}`, {
            method: 'PUT',
            body: {
              titleAr,
              titleEn,
              imageUrl,
              mobileImageUrl: ad.mobileImageUrl ?? null,
              linkUrl,
              displayOrder: ad.displayOrder ?? 0,
              startDate: ad.startDate ?? null,
              endDate: ad.endDate ?? null
            }
          });
          toast.success('Banner details updated');
          modal.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error(err.message);
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  });
}

function openDeleteAdModal(adId, onSuccess) {
  modal.showModal({
    title: 'Delete Advertisement',
    contentHtml: `
      <p style="color: var(--text-secondary); line-height: 1.6;">
        Are you sure you want to remove this advertisement? This executes:
        <br>
        <code style="color: var(--danger);">DELETE /api/admin/advertisements/${adId}</code>
      </p>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>Cancel</button>
      <button class="btn btn-danger" id="btn-confirm-delete-ad">Delete</button>
    `,
    onOpen: (modalEl) => {
      const delBtn = modalEl.querySelector('#btn-confirm-delete-ad');
      delBtn.addEventListener('click', async () => {
        try {
          delBtn.disabled = true;
          await api.request(`/api/admin/advertisements/${adId}`, { method: 'DELETE' });
          toast.success('Advertisement deleted');
          modal.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error(err.message);
        } finally {
          delBtn.disabled = false;
        }
      });
    }
  });
}
