import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';

let searchQuery = '';

export async function renderProductsView(container) {
  const isAr = i18n.isRtl();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${i18n.t('products_title')}</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${i18n.t('products_subtitle')}
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-products">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          ${i18n.t('refresh')}
        </button>
        <button class="btn btn-primary btn-sm" id="btn-add-product">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${i18n.t('add_product')}
        </button>
      </div>
    </div>

    <!-- Search Toolbar -->
    <div class="filter-toolbar">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="products-search-input" placeholder="${i18n.t('search_products')}" value="${searchQuery}">
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>${i18n.t('product_title')}</th>
              <th>${i18n.t('category_column')}</th>
              <th>${i18n.t('slug')}</th>
              <th>${i18n.t('unit_price')}</th>
              <th>${i18n.t('stock_quantity')}</th>
              <th>${i18n.t('status')}</th>
              <th>${i18n.t('gallery')}</th>
              <th style="text-align: ${isAr ? 'left' : 'right'};">${i18n.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="products-table-body">
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

  const searchInput = container.querySelector('#products-search-input');
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadProducts();
    }, 250);
  });

  container.querySelector('#btn-refresh-products').addEventListener('click', () => loadProducts());
  container.querySelector('#btn-add-product').addEventListener('click', () => openCreateProductModal(() => loadProducts()));

  async function loadProducts() {
    const tbody = container.querySelector('#products-table-body');
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">${i18n.t('loading')}</td></tr>`;

    try {
      const [res, categories] = await Promise.all([
        api.request('/api/admin/products', {
          method: 'GET',
          params: { search: searchQuery, page: 1, pageSize: 50 }
        }),
        api.request('/api/admin/categories', { method: 'GET' }).catch(() => [])
      ]);

      const items = res.items || (Array.isArray(res) ? res : []);
      const categoryMap = {};
      (categories || []).forEach(cat => { categoryMap[cat.id] = cat; });

      if (!items || items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              ${i18n.t('no_data')}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = items.map(product => {
        const primaryTitle = isAr ? (product.titleAr || product.titleEn) : (product.titleEn || product.titleAr);
        const secondaryTitle = isAr ? (product.titleEn && product.titleEn !== primaryTitle ? product.titleEn : '') : (product.titleAr && product.titleAr !== primaryTitle ? product.titleAr : '');
        const desc = isAr ? (product.descriptionAr || product.descriptionEn || '') : (product.descriptionEn || product.descriptionAr || '');
        const primaryImg = product.images?.find(img => img.isPrimary)?.imageUrl || product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.imageUrl || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
        const isOutOfStock = product.stockQuantity <= 0;

        // Resolve Category Name
        const cat = categoryMap[product.categoryId];
        const catName = cat ? (isAr ? (cat.nameAr || cat.nameEn) : (cat.nameEn || cat.nameAr)) : (product.categoryName || i18n.t('unassigned_category'));

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <img src="${primaryImg}" alt="${primaryTitle}" class="product-avatar-img" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'">
                <div>
                  <div style="font-weight: 700; font-size: 0.92rem;">${primaryTitle}</div>
                  ${secondaryTitle ? `<div style="font-size: 0.75rem; color: var(--primary); font-weight: 500;">${secondaryTitle}</div>` : ''}
                  <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.1rem;">
                    ${desc || (product.subtitleEn || product.subtitleAr || '')}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span class="badge" style="background: rgba(158, 125, 83, 0.12); color: var(--primary); border: 1px solid rgba(158, 125, 83, 0.25); font-weight: 700; font-size: 0.8rem; padding: 0.35rem 0.65rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-inline-end: 4px; vertical-align: middle;">
                  <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line>
                </svg>
                ${catName}
              </span>
            </td>
            <td>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--primary);">
                ${product.slug || '—'}
              </span>
            </td>
            <td>
              <span style="font-weight: 700; font-size: 0.95rem;">${i18n.formatCurrency(product.price)}</span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 700; ${isOutOfStock ? 'color: var(--danger);' : ''}">
                  ${product.stockQuantity} ${i18n.t('units')}
                </span>
                <button class="btn btn-outline btn-sm btn-update-stock" data-id="${product.id}" data-stock="${product.stockQuantity}" title="${i18n.t('quick_stock_edit')}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
              </div>
            </td>
            <td>
              <label class="switch" title="Toggle active status">
                <input type="checkbox" class="product-status-toggle" data-id="${product.id}" ${product.isActive ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </td>
            <td>
              <button class="btn btn-secondary btn-sm btn-manage-images" data-id="${product.id}">
                ${product.images?.length || 0} ${i18n.t('gallery')} &rarr;
              </button>
            </td>
            <td style="text-align: ${isAr ? 'left' : 'right'};">
              <div style="display: inline-flex; gap: 0.4rem;">
                <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${product.id}">
                  ${i18n.t('edit')}
                </button>
                <button class="btn btn-danger btn-sm btn-delete-product" data-id="${product.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.product-status-toggle').forEach(toggle => {
        toggle.addEventListener('change', async () => {
          const id = toggle.getAttribute('data-id');
          const isActive = toggle.checked;
          toggle.disabled = true;
          try {
            await api.request(`/api/admin/products/${id}/status`, {
              method: 'PATCH',
              body: { isActive }
            });
            toast.success(i18n.t('success'));
          } catch (err) {
            toast.error(err.message);
            toggle.checked = !isActive;
          } finally {
            toggle.disabled = false;
          }
        });
      });

      tbody.querySelectorAll('.btn-update-stock').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const current = btn.getAttribute('data-stock');
          openStockUpdateModal(id, current, () => loadProducts());
        });
      });

      tbody.querySelectorAll('.btn-manage-images').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openProductImageManager(id, () => loadProducts());
        });
      });

      tbody.querySelectorAll('.btn-edit-product').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openEditProductModal(id, () => loadProducts());
        });
      });

      tbody.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openDeleteConfirmModal(id, () => loadProducts());
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--danger);">${err.message}</td></tr>`;
      toast.error(err.message);
    }
  }

  await loadProducts();
}

async function openCreateProductModal(onSuccess) {
  let categories = [];
  try {
    categories = await api.request('/api/admin/categories', { method: 'GET' }) || [];
  } catch (e) {
    // fallback
  }

  const isAr = i18n.isRtl();

  const contentHtml = `
    <form id="create-product-form">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="new-prod-title-ar">${i18n.t('title_ar')} <span class="required">*</span></label>
          <input type="text" id="new-prod-title-ar" class="form-control" placeholder="مثال: ساعة تروس ميكانيكية" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-prod-title-en">${i18n.t('title_en')} <span class="required">*</span></label>
          <input type="text" id="new-prod-title-en" class="form-control" placeholder="e.g. Mechanical Gear Clock" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="new-prod-subtitle-ar">${i18n.t('subtitle_ar')}</label>
          <input type="text" id="new-prod-subtitle-ar" class="form-control" placeholder="قطعة ديكور يدوية">
        </div>
        <div class="form-group">
          <label class="form-label" for="new-prod-subtitle-en">${i18n.t('subtitle_en')}</label>
          <input type="text" id="new-prod-subtitle-en" class="form-control" placeholder="Handmade decorative piece">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="new-prod-category">${i18n.t('category_column')} <span class="required">*</span></label>
        <select id="new-prod-category" class="form-select" required>
          ${categories.length === 0 ? `<option value="">${i18n.t('unassigned_category')}</option>` : ''}
          ${categories.map(c => `<option value="${c.id}">${c.nameAr || c.nameEn} (${c.nameEn || c.nameAr})</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="new-prod-slug">${i18n.t('slug')} <span class="required">*</span></label>
        <input type="text" id="new-prod-slug" class="form-control" placeholder="metal-gear-clock" required>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="new-prod-desc-ar">${i18n.t('desc_ar')}</label>
          <textarea id="new-prod-desc-ar" class="form-textarea" placeholder="وصف وتفاصيل المنتج بالعربية..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-prod-desc-en">${i18n.t('desc_en')}</label>
          <textarea id="new-prod-desc-en" class="form-textarea" placeholder="Detailed product specifications in English..."></textarea>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="new-prod-price">${i18n.t('price')} <span class="required">*</span></label>
          <input type="number" id="new-prod-price" class="form-control" step="0.01" min="0" placeholder="1500.00" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-prod-stock">${i18n.t('stock_quantity')} <span class="required">*</span></label>
          <input type="number" id="new-prod-stock" class="form-control" min="0" value="10" required>
        </div>
      </div>
    </form>
  `;

  modal.showModal({
    title: i18n.t('create_product_title'),
    contentHtml,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-primary" id="btn-submit-create-prod">${i18n.t('save')}</button>
    `,
    onOpen: (modalEl) => {
      const submitBtn = modalEl.querySelector('#btn-submit-create-prod');
      submitBtn.addEventListener('click', async () => {
        const titleAr = modalEl.querySelector('#new-prod-title-ar').value.trim();
        const titleEn = modalEl.querySelector('#new-prod-title-en').value.trim();
        const subtitleAr = modalEl.querySelector('#new-prod-subtitle-ar').value.trim();
        const subtitleEn = modalEl.querySelector('#new-prod-subtitle-en').value.trim();
        const slug = modalEl.querySelector('#new-prod-slug').value.trim() || titleEn.toLowerCase().replace(/\s+/g, '-');
        const descriptionAr = modalEl.querySelector('#new-prod-desc-ar').value.trim();
        const descriptionEn = modalEl.querySelector('#new-prod-desc-en').value.trim();
        const price = parseFloat(modalEl.querySelector('#new-prod-price').value);
        const stockQuantity = parseInt(modalEl.querySelector('#new-prod-stock').value, 10);
        const categoryId = modalEl.querySelector('#new-prod-category').value;

        if (!titleAr || !titleEn || isNaN(price) || !categoryId) {
          toast.warning(isAr ? 'يرجى ملء الاسمين بالعربية والإنجليزية وتحديد القسم والسعر' : 'Arabic & English titles, category and valid price are required');
          return;
        }

        try {
          submitBtn.disabled = true;
          await api.request('/api/admin/products', {
            method: 'POST',
            body: {
              categoryId,
              titleAr,
              titleEn,
              subtitleAr,
              subtitleEn,
              descriptionAr,
              descriptionEn,
              price,
              stockQuantity,
              slug
            }
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

async function openEditProductModal(productId, onSuccess) {
  try {
    const [prod, categories] = await Promise.all([
      api.request(`/api/admin/products/${productId}`, { method: 'GET' }),
      api.request('/api/admin/categories', { method: 'GET' }).catch(() => [])
    ]);

    const isAr = i18n.isRtl();

    const contentHtml = `
      <form id="edit-product-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="edit-prod-title-ar">${i18n.t('title_ar')}</label>
            <input type="text" id="edit-prod-title-ar" class="form-control" value="${prod.titleAr || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-prod-title-en">${i18n.t('title_en')}</label>
            <input type="text" id="edit-prod-title-en" class="form-control" value="${prod.titleEn || ''}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="edit-prod-subtitle-ar">${i18n.t('subtitle_ar')}</label>
            <input type="text" id="edit-prod-subtitle-ar" class="form-control" value="${prod.subtitleAr || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-prod-subtitle-en">${i18n.t('subtitle_en')}</label>
            <input type="text" id="edit-prod-subtitle-en" class="form-control" value="${prod.subtitleEn || ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-prod-category">${i18n.t('category_column')}</label>
          <select id="edit-prod-category" class="form-select">
            ${(categories || []).map(c => `
              <option value="${c.id}" ${c.id === prod.categoryId ? 'selected' : ''}>
                ${c.nameAr || c.nameEn} (${c.nameEn || c.nameAr})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-prod-slug">${i18n.t('slug')}</label>
          <input type="text" id="edit-prod-slug" class="form-control" value="${prod.slug || ''}">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="edit-prod-desc-ar">${i18n.t('desc_ar')}</label>
            <textarea id="edit-prod-desc-ar" class="form-textarea">${prod.descriptionAr || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-prod-desc-en">${i18n.t('desc_en')}</label>
            <textarea id="edit-prod-desc-en" class="form-textarea">${prod.descriptionEn || ''}</textarea>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="edit-prod-price">${i18n.t('price')}</label>
            <input type="number" id="edit-prod-price" class="form-control" step="0.01" value="${prod.price || 0}">
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-prod-stock">${i18n.t('stock_quantity')}</label>
            <input type="number" id="edit-prod-stock" class="form-control" value="${prod.stockQuantity || 0}">
          </div>
        </div>
      </form>
    `;

    modal.showModal({
      title: `${i18n.t('edit_product_title')}: ${isAr ? (prod.titleAr || prod.titleEn) : (prod.titleEn || prod.titleAr)}`,
      contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
        <button class="btn btn-primary" id="btn-submit-edit-prod">${i18n.t('save')}</button>
      `,
      onOpen: (modalEl) => {
        const submitBtn = modalEl.querySelector('#btn-submit-edit-prod');
        submitBtn.addEventListener('click', async () => {
          const titleAr = modalEl.querySelector('#edit-prod-title-ar').value.trim();
          const titleEn = modalEl.querySelector('#edit-prod-title-en').value.trim();
          const subtitleAr = modalEl.querySelector('#edit-prod-subtitle-ar').value.trim();
          const subtitleEn = modalEl.querySelector('#edit-prod-subtitle-en').value.trim();
          const slug = modalEl.querySelector('#edit-prod-slug').value.trim();
          const descriptionAr = modalEl.querySelector('#edit-prod-desc-ar').value.trim();
          const descriptionEn = modalEl.querySelector('#edit-prod-desc-en').value.trim();
          const price = parseFloat(modalEl.querySelector('#edit-prod-price').value);
          const stockQuantity = parseInt(modalEl.querySelector('#edit-prod-stock').value, 10);
          const categoryId = modalEl.querySelector('#edit-prod-category').value;

          try {
            submitBtn.disabled = true;
            await api.request(`/api/admin/products/${productId}`, {
              method: 'PUT',
              body: {
                categoryId,
                titleAr,
                titleEn,
                subtitleAr,
                subtitleEn,
                descriptionAr,
                descriptionEn,
                price,
                stockQuantity,
                slug
              }
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

  } catch (err) {
    toast.error(err.message);
  }
}

function openStockUpdateModal(productId, currentStock, onSuccess) {
  modal.showModal({
    title: i18n.t('quick_stock_edit'),
    contentHtml: `
      <div class="form-group">
        <label class="form-label">${i18n.t('stock_quantity')}</label>
        <input type="number" id="quick-stock-val" class="form-control" value="${currentStock}" min="0">
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-primary" id="btn-save-stock">${i18n.t('update')}</button>
    `,
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-save-stock').addEventListener('click', async () => {
        const stockQuantity = parseInt(modalEl.querySelector('#quick-stock-val').value, 10);
        if (isNaN(stockQuantity)) return;

        try {
          await api.request(`/api/admin/products/${productId}/stock`, {
            method: 'PATCH',
            body: { stockQuantity }
          });
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

async function openProductImageManager(productId, onUpdate) {
  try {
    const prod = await api.request(`/api/admin/products/${productId}`, { method: 'GET' });
    const images = prod.images || [];

    const contentHtml = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          ${i18n.t('gallery')} - ${prod.titleEn || prod.titleAr}
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem;" id="gallery-grid">
          ${images.map(img => `
            <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle); background: var(--bg-surface-elevated);">
              <img src="${img.imageUrl || img.url}" alt="Product image" style="width: 100%; height: 110px; object-fit: cover; display: block;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'">
              ${img.isPrimary ? `<span style="position: absolute; top: 4px; left: 4px; background: var(--primary); color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">Primary</span>` : ''}
              <button class="btn btn-danger btn-icon btn-sm btn-del-img" data-img-id="${img.id}" style="position: absolute; bottom: 4px; right: 4px; padding: 4px;" title="Delete image">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          `).join('')}
        </div>

        <div style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
          <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.75rem;">+ Add Photo by URL</div>
          <div style="display: flex; gap: 0.5rem;">
            <input type="url" id="new-img-url" class="form-control" placeholder="https://example.com/photo.jpg" style="flex: 1;">
            <button class="btn btn-primary btn-sm" id="btn-add-img-url">Add Photo</button>
          </div>
        </div>
      </div>
    `;

    modal.showModal({
      title: i18n.t('gallery'),
      contentHtml,
      footerHtml: `
        <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('close')}</button>
      `,
      onOpen: (modalEl) => {
        modalEl.querySelectorAll('.btn-del-img').forEach(btn => {
          btn.addEventListener('click', async () => {
            const imageId = btn.getAttribute('data-img-id');
            try {
              await api.request(`/api/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
              toast.success(i18n.t('success'));
              modal.closeModal();
              openProductImageManager(productId, onUpdate);
              if (onUpdate) onUpdate();
            } catch (err) {
              toast.error(err.message);
            }
          });
        });

        modalEl.querySelector('#btn-add-img-url').addEventListener('click', async () => {
          const imageUrl = modalEl.querySelector('#new-img-url').value.trim();
          if (!imageUrl) return;

          try {
            await api.request(`/api/admin/products/${productId}/images`, {
              method: 'POST',
              body: { imageUrl, displayOrder: images.length, isPrimary: images.length === 0 }
            });
            toast.success(i18n.t('success'));
            modal.closeModal();
            openProductImageManager(productId, onUpdate);
            if (onUpdate) onUpdate();
          } catch (err) {
            toast.error(err.message);
          }
        });
      }
    });

  } catch (err) {
    toast.error(err.message);
  }
}

function openDeleteConfirmModal(productId, onSuccess) {
  modal.showModal({
    title: i18n.t('delete'),
    contentHtml: `
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        ${i18n.isRtl() ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product from the database?'}
      </p>
    `,
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-danger" id="btn-confirm-delete-prod">${i18n.t('delete')}</button>
    `,
    onOpen: (modalEl) => {
      modalEl.querySelector('#btn-confirm-delete-prod').addEventListener('click', async () => {
        try {
          await api.request(`/api/admin/products/${productId}`, { method: 'DELETE' });
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
