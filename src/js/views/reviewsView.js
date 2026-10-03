import { api } from '../api/client.js';
import { toast } from '../ui/toast.js';
import { modal } from '../ui/modal.js';

export async function renderReviewsView(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Reviews Moderation</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Screen incoming customer testimonials, approve verified reviews, or reject spam.
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-reviews">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Reviews Grid / Table -->
    <div class="card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product Target</th>
              <th>Customer</th>
              <th>Star Rating</th>
              <th>Review Comment</th>
              <th>Status</th>
              <th>Submitted Date</th>
              <th style="text-align: right;">Moderation Actions</th>
            </tr>
          </thead>
          <tbody id="reviews-table-body">
            <tr>
              <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                Loading moderation queue...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelector('#btn-refresh-reviews').addEventListener('click', () => loadReviews());

  async function loadReviews() {
    const tbody = container.querySelector('#reviews-table-body');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">Loading reviews...</td></tr>`;

    try {
      const reviews = await api.request('/api/admin/reviews', {
        method: 'GET',
        params: { page: 1, pageSize: 50 }
      });

      if (!reviews || reviews.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">No reviews in the moderation queue.</td></tr>`;
        return;
      }

      tbody.innerHTML = reviews.map(rev => {
        const starIcons = Array.from({ length: 5 }, (_, i) => {
          const filled = i < rev.rating;
          return `<span style="color: ${filled ? '#a56319' : '#475569'}; font-size: 1rem;">★</span>`;
        }).join('');

        let badgeClass = 'badge-pending';
        if (rev.status === 'Approved') badgeClass = 'badge-active';
        if (rev.status === 'Rejected') badgeClass = 'badge-cancelled';

        const dateStr = new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <tr>
            <td>
              <div style="font-weight: 700; font-size: 0.85rem;">${rev.productName || 'Product ' + rev.productId}</div>
              <span style="font-size: 0.725rem; font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">ID: ${rev.productId}</span>
            </td>
            <td>
              <div style="font-weight: 600;">${rev.user?.name || 'Customer'}</div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.15rem;">
                ${starIcons}
                <span style="font-weight: 700; font-size: 0.775rem; margin-left: 0.35rem;">(${rev.rating}/5)</span>
              </div>
            </td>
            <td>
              <div style="max-width: 320px; font-size: 0.825rem; color: var(--text-main); line-height: 1.4;">
                "${rev.comment}"
              </div>
            </td>
            <td>
              <span class="badge ${badgeClass}">${rev.status}</span>
            </td>
            <td style="color: var(--text-muted); font-size: 0.775rem;">${dateStr}</td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 0.35rem;">
                ${rev.status !== 'Approved' ? `
                  <button class="btn btn-success btn-sm btn-approve-review" data-id="${rev.id}" title="Approve (PATCH /api/admin/reviews/{id}/approve)">
                    Approve
                  </button>
                ` : ''}
                ${rev.status !== 'Rejected' ? `
                  <button class="btn btn-secondary btn-sm btn-reject-review" data-id="${rev.id}" title="Reject (PATCH /api/admin/reviews/{id}/reject)">
                    Reject
                  </button>
                ` : ''}
                <button class="btn btn-danger btn-sm btn-delete-review" data-id="${rev.id}" title="Delete (DELETE /api/admin/reviews/{id})">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Approve (PATCH /api/admin/reviews/{id}/approve)
      tbody.querySelectorAll('.btn-approve-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api.request(`/api/admin/reviews/${id}/approve`, { method: 'PATCH' });
            toast.success('Review approved and published to store');
            loadReviews();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

      // Reject (PATCH /api/admin/reviews/{id}/reject)
      tbody.querySelectorAll('.btn-reject-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api.request(`/api/admin/reviews/${id}/reject`, { method: 'PATCH' });
            toast.warning('Review marked as rejected');
            loadReviews();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

      // Delete (DELETE /api/admin/reviews/{id})
      tbody.querySelectorAll('.btn-delete-review').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          try {
            await api.request(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            toast.success('Review deleted');
            loadReviews();
          } catch (err) {
            toast.error(err.message);
          }
        });
      });

    } catch (err) {
      toast.error(`Failed to load reviews: ${err.message}`);
    }
  }

  await loadReviews();
}
