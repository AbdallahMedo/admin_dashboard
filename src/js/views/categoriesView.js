import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';

export async function renderCategoriesView(container) {
  const isAr = i18n.isRtl();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${i18n.t('categories_title')}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${i18n.t('categories_subtitle')}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-categories">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          ${i18n.t('refresh')}
        </button>
        <button class="btn btn-primary btn-sm" id="btn-add-category">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${i18n.t('add_category')}
        </button>
      </div>
    </div>

    <!-- Categories Grid / Table -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.t('name_ar')}</th>
              <th>${i18n.t('name_en')}</th>
              <th>${i18n.t('slug')}</th>
              <th>${i18n.t('gallery')}</th>
              <th>${i18n.t('public_status')}</th>
              <th style="text-align: ${isAr ? 'left' : 'right'};">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="categories-table-body">
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

  container.querySelector('#btn-refresh-categories').addEventListener('click', () => loadCategories());
  container.querySelector('#btn-add-category').addEventListener('click', () => openCreateCategoryModal(() => loadCategories()));

  async function loadCategories() {
    const tbody = container.querySelector('#categories-table-body');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">${i18n.t('loading')}</td></tr>`;

    try {
      const categories = await api.request('/api/admin/categories', { method: 'GET' });

      if (!categories || categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">${i18n.t('no_data')}</td></tr>`;
        return;
      }

      tbody.innerHTML = categories.map(cat => {
        const nameAr = cat.nameAr || '—';
        const nameEn = cat.nameEn || '—';
        const img = cat.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=80';

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <img src="${img}" alt="${nameEn}" style="width: 38px; height: 38px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border-subtle);" onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=80'">
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">${nameAr}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-weight: 600; font-size: 0.9rem;">${nameEn}</div>
            </td>
            <td>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.775rem; color: var(--text-muted);">
                /${cat.slug}
              </span>
            </td>
            <td>
              <span style="font-size: 0.75rem; color: var(--text-secondary); max-width: 140px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${cat.imageUrl ? 'Photo URL Attached' : 'No photo'}
              </span>
            </td>
            <td>
              <label class="switch" title="Toggle active status">
                <input type="checkbox" class="cat-status-toggle" data-id="${cat.id}" ${cat.isActive ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </td>
            <td style="text-align: ${isAr ? 'left' : 'right'};">
              <div style="display: inline-flex; gap: 0.4rem;">
                <button class="btn btn-secondary btn-sm btn-edit-category" data-id="${cat.id}">
                  ${i18n.t('edit')}
                </button>
                <button class="btn btn-danger btn-sm btn-delete-category" data-id="${cat.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Status Toggle (PATCH /api/admin/categories/{id}/status)
      tbody.querySelectorAll('.cat-status-toggle').forEach(toggle => {
        toggle.addEventListener('change', async () => {
          const id = toggle.getAttribute('data-id');
          const isActive = toggle.checked;
          try {
            await api.request(`/api/admin/categories/${id}/status`, {
              method: 'PATCH',
              body: { isActive }
            });
            toast.success(i18n.t('success'));
          } catch (err) {
            toast.error(err.message);
            toggle.checked = !isActive;
          }
        });
      });

      // Edit Category
      tbody.querySelectorAll('.btn-edit-category').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const cat = categories.find(c => c.id === id);
          if (cat) openEditCategoryModal(cat, () => loadCategories());
        });
      });

      // Delete Category (DELETE /api/admin/categories/{id})
      tbody.querySelectorAll('.btn-delete-category').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openDeleteCategoryModal(id, () => loadCategories());
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--danger);">${err.message}</td></tr>`;
      toast.error(`Failed to load categories: ${err.message}`);
    }
  }

  await loadCategories();
}

function openCreateCategoryModal(onSuccess) {
  const isAr = i18n.isRtl();

  modal.showModal({
    title: i18n.t('create_category_title'),
    contentHtml: `
      <form id="create-cat-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">${i18n.t('name_ar')} <span class="required">*</span></label>
            <input type="text" id="new-cat-name-ar" class="form-control" placeholder="مثال: ديكور ميكانيكي" required>
          </div>
          <div class="form-group">
            <label class="form-label">${i18n.t('name_en')} <span class="required">*</span></label>
            <input type="text" id="new-cat-name-en" class="form-control" placeholder="e.g. Mechanical Decor" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${i18n.t('slug')} <span class="required">*</span></label>
          <input type="text" id="new-cat-slug" class="form-control" placeholder="mechanical-decor" required>
        </div>
        <div class="form-group">
          <label class="form-label">Banner Image URL</label>
          <input type="url" id="new-cat-img" class="form-control" placeholder="https://example.com/category-banner.jpg">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-primary" id="btn-submit-create-cat">${i18n.t('save')}</button>
    `,
    onOpen: (modalEl) => {
      const submitBtn = modalEl.querySelector('#btn-submit-create-cat');
      submitBtn.addEventListener('click', async () => {
        const nameAr = modalEl.querySelector('#new-cat-name-ar').value.trim();
        const nameEn = modalEl.querySelector('#new-cat-name-en').value.trim();
        const slug = modalEl.querySelector('#new-cat-slug').value.trim() || nameEn.toLowerCase().replace(/\s+/g, '-');
        const imageUrl = modalEl.querySelector('#new-cat-img').value.trim() || null;

        if (!nameAr || !nameEn) {
          toast.warning(isAr ? 'يرجى إدخال اسم القسم بالعربية والإنجليزية' : 'Both Arabic and English names are required');
          return;
        }

        try {
          submitBtn.disabled = true;
          await api.request('/api/admin/categories', {
            method: 'POST',
            body: { nameAr, nameEn, slug, imageUrl }
          });
          toast.success(i18n.t('success'));
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

function openEditCategoryModal(cat, onSuccess) {
  const isAr = i18n.isRtl();

  modal.showModal({
    title: `${i18n.t('edit_category_title')}: ${isAr ? (cat.nameAr || cat.nameEn) : (cat.nameEn || cat.nameAr)}`,
    contentHtml: `
      <form id="edit-cat-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">${i18n.t('name_ar')}</label>
            <input type="text" id="edit-cat-name-ar" class="form-control" value="${cat.nameAr || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">${i18n.t('name_en')}</label>
            <input type="text" id="edit-cat-name-en" class="form-control" value="${cat.nameEn || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${i18n.t('slug')}</label>
          <input type="text" id="edit-cat-slug" class="form-control" value="${cat.slug || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Banner Image URL</label>
          <input type="url" id="edit-cat-img" class="form-control" value="${cat.imageUrl || ''}">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-primary" id="btn-submit-edit-cat">${i18n.t('save')}</button>
    `,
    onOpen: (modalEl) => {
      const submitBtn = modalEl.querySelector('#btn-submit-edit-cat');
      submitBtn.addEventListener('click', async () => {
        const nameAr = modalEl.querySelector('#edit-cat-name-ar').value.trim();
        const nameEn = modalEl.querySelector('#edit-cat-name-en').value.trim();
        const slug = modalEl.querySelector('#edit-cat-slug').value.trim();
        const imageUrl = modalEl.querySelector('#edit-cat-img').value.trim() || null;

        try {
          submitBtn.disabled = true;
          await api.request(`/api/admin/categories/${cat.id}`, {
            method: 'PUT',
            body: { nameAr, nameEn, slug, imageUrl }
          });
          toast.success(i18n.t('success'));
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

function openDeleteCategoryModal(categoryId, onSuccess) {
  modal.showModal({
    title: i18n.t('delete'),
    contentHtml: `
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        ${i18n.isRtl() ? 'هل أنت متأكد من رغبتك في حذف هذا القسم من المتجر؟' : 'Are you sure you want to delete this category? Products linked may become unassigned.'}
      </p>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-danger" id="btn-confirm-delete-cat">${i18n.t('delete')}</button>
    `,
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-confirm-delete-cat').addEventListener('click', async () => {
        try {
          await api.request(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
          toast.success(i18n.t('success'));
          modal.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          toast.error(err.message);
        }
      });
    }
  });
}
