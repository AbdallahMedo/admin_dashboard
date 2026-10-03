import { ENDPOINTS_CATALOG } from '../api/endpoints.js';
import { api } from '../api/client.js';
import { authState } from '../state/authState.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';

let selectedCategory = 'All';
let filterQuery = '';

export function renderApiExplorerView(container) {
  const categories = ['All', ...new Set(ENDPOINTS_CATALOG.map(e => e.category))];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Admin API Endpoints Console</h2>
          <span class="badge badge-admin">${ENDPOINTS_CATALOG.length} Endpoints</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Interactive registry of all backend contracts defined in ADMIN_DASHBOARD_FRONTEND.md. Test, inspect, and execute live queries.
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span class="badge ${authState.isMockMode() ? 'badge-warning' : 'badge-active'}">
          Target: ${authState.isMockMode() ? 'In-Memory Mock Engine' : authState.getBaseUrl()}
        </span>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="filter-toolbar">
      <div class="filter-tabs" id="endpoint-category-tabs">
        ${categories.map(cat => `
          <button class="filter-tab ${cat === selectedCategory ? 'active' : ''}" data-cat="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="endpoint-search-input" placeholder="Search path or description..." value="${filterQuery}">
      </div>
    </div>

    <!-- Endpoints Directory -->
    <div id="endpoints-list-container"></div>
  `;

  // Hook category tabs
  container.querySelectorAll('#endpoint-category-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('#endpoint-category-tabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedCategory = tab.getAttribute('data-cat');
      renderFilteredEndpoints();
    });
  });

  // Hook search input
  const searchInput = container.querySelector('#endpoint-search-input');
  searchInput.addEventListener('input', (e) => {
    filterQuery = e.target.value.toLowerCase().trim();
    renderFilteredEndpoints();
  });

  function renderFilteredEndpoints() {
    const listContainer = container.querySelector('#endpoints-list-container');

    const filtered = ENDPOINTS_CATALOG.filter(ep => {
      const matchCat = selectedCategory === 'All' || ep.category === selectedCategory;
      const matchQuery = !filterQuery || 
        ep.path.toLowerCase().includes(filterQuery) || 
        ep.description.toLowerCase().includes(filterQuery) ||
        ep.method.toLowerCase().includes(filterQuery);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No API endpoints match your search criteria.
        </div>
      `;
      return;
    }

    // Group by category
    const groups = {};
    filtered.forEach(ep => {
      if (!groups[ep.category]) groups[ep.category] = [];
      groups[ep.category].push(ep);
    });

    listContainer.innerHTML = Object.entries(groups).map(([catName, endpoints]) => `
      <div class="endpoint-category-group">
        <div class="endpoint-category-title">
          <span>${catName}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">(${endpoints.length})</span>
        </div>
        <div class="endpoint-cards-grid">
          ${endpoints.map(ep => {
            const methodClass = ep.method.toLowerCase();
            return `
              <div class="endpoint-card" data-id="${ep.id}">
                <div class="endpoint-route-info">
                  <span class="method-badge ${methodClass}">${ep.method}</span>
                  <span class="endpoint-path">${ep.path}</span>
                  ${ep.requiresAuth ? `<span class="endpoint-auth-tag">Bearer Auth</span>` : `<span class="badge badge-inactive">Public</span>`}
                  <div class="endpoint-desc">${ep.description}</div>
                </div>
                <div>
                  <button class="btn btn-secondary btn-sm btn-try-endpoint" data-id="${ep.id}">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Test Endpoint
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Attach click listeners to cards and "Test Endpoint" buttons
    listContainer.querySelectorAll('.endpoint-card, .btn-try-endpoint').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-id');
        const endpoint = ENDPOINTS_CATALOG.find(x => x.id === id);
        if (endpoint) openInteractiveTester(endpoint);
      });
    });
  }

  renderFilteredEndpoints();
}

// Live Interactive API Tester Modal
function openInteractiveTester(ep) {
  let initialBodyStr = '';
  if (ep.bodyTemplate) {
    let templ = { ...ep.bodyTemplate };
    if (templ.refreshToken === '{{REFRESH_TOKEN}}') {
      templ.refreshToken = authState.refreshToken || 'simulated_refresh_token_xyz';
    }
    initialBodyStr = JSON.stringify(templ, null, 2);
  }

  const contentHtml = `
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
        <span class="method-badge ${ep.method.toLowerCase()}" style="font-size: 0.85rem; padding: 0.25rem 0.75rem;">${ep.method}</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; font-weight: 700;">${ep.path}</span>
        ${ep.requiresAuth ? `<span class="endpoint-auth-tag">Requires Bearer Token</span>` : ''}
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary);">${ep.description}</p>
    </div>

    <div class="api-tester-panel">
      <!-- Left: Request Configuration -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
          Request Parameters
        </div>

        ${(ep.pathParams || []).length > 0 ? `
          <div class="card" style="padding: 0.85rem; background: var(--bg-surface-elevated);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">Path Placeholders</div>
            ${ep.pathParams.map(pp => `
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <label class="form-label">{${pp.name}}</label>
                <input type="text" class="form-control path-param-input" data-param="${pp.name}" value="${pp.example}">
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${(ep.queryParams || []).length > 0 ? `
          <div class="card" style="padding: 0.85rem; background: var(--bg-surface-elevated);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--info); margin-bottom: 0.5rem;">Query Parameters (?param=val)</div>
            ${ep.queryParams.map(qp => `
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <label class="form-label">${qp.name} <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${qp.description || ''})</span></label>
                <input type="text" class="form-control query-param-input" data-param="${qp.name}" value="${qp.example}">
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- JSON Request Body Editor -->
        ${(ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') ? `
          <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
            <label class="form-label">
              JSON Request Body
              <button type="button" class="btn btn-ghost btn-sm" id="btn-format-json" style="padding: 0 0.4rem; font-size: 0.7rem;">Format JSON</button>
            </label>
            <textarea id="tester-body-editor" class="form-textarea" style="flex: 1; min-height: 160px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background-color: #080b11;">${initialBodyStr}</textarea>
          </div>
        ` : ''}

        <button class="btn btn-primary" id="btn-execute-test" style="width: 100%;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Send ${ep.method} Request
        </button>
      </div>

      <!-- Right: Response Viewer -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
            Response Inspection
          </span>
          <div style="display: flex; align-items: center; gap: 0.5rem;" id="response-meta-info">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Awaiting trigger</span>
          </div>
        </div>

        <div class="response-viewer" id="tester-response-output">
Click "Send ${ep.method} Request" to test this endpoint against ${authState.isMockMode() ? 'the in-memory mock engine' : authState.getBaseUrl()}.
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" id="btn-copy-response">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Response JSON
          </button>
        </div>
      </div>
    </div>
  `;

  modal.showModal({
    title: `Live Endpoint Explorer - ${ep.method} ${ep.path}`,
    contentHtml,
    size: 'xl',
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>Close Console</button>
    `,
    onOpen: (modalEl) => {
      const executeBtn = modalEl.querySelector('#btn-execute-test');
      const responseOutput = modalEl.querySelector('#tester-response-output');
      const metaContainer = modalEl.querySelector('#response-meta-info');
      const copyBtn = modalEl.querySelector('#btn-copy-response');

      // Copy response
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(responseOutput.textContent);
        toast.info('Response JSON copied to clipboard');
      });

      // Format JSON
      const formatBtn = modalEl.querySelector('#btn-format-json');
      if (formatBtn) {
        formatBtn.addEventListener('click', () => {
          const bodyArea = modalEl.querySelector('#tester-body-editor');
          try {
            const parsed = JSON.parse(bodyArea.value);
            bodyArea.value = JSON.stringify(parsed, null, 2);
          } catch (e) {
            toast.error('Invalid JSON syntax in body editor');
          }
        });
      }

      // Execute request
      executeBtn.addEventListener('click', async () => {
        // Resolve path parameters
        let resolvedPath = ep.path;
        modalEl.querySelectorAll('.path-param-input').forEach(inp => {
          const paramName = inp.getAttribute('data-param');
          resolvedPath = resolvedPath.replace(`{${paramName}}`, encodeURIComponent(inp.value.trim()));
        });

        // Resolve query parameters
        const queryParams = {};
        modalEl.querySelectorAll('.query-param-input').forEach(inp => {
          const qName = inp.getAttribute('data-param');
          const val = inp.value.trim();
          if (val) queryParams[qName] = val;
        });

        // Parse body
        let parsedBody = null;
        const bodyEditor = modalEl.querySelector('#tester-body-editor');
        if (bodyEditor && bodyEditor.value.trim()) {
          try {
            parsedBody = JSON.parse(bodyEditor.value.trim());
          } catch (jsonErr) {
            toast.error('Invalid JSON in request body');
            return;
          }
        }

        executeBtn.disabled = true;
        responseOutput.textContent = 'Transmitting request...';
        metaContainer.innerHTML = '<span style="font-size: 0.75rem; color: var(--primary);">Connecting...</span>';

        const startTime = performance.now();

        try {
          const data = await api.request(resolvedPath, {
            method: ep.method,
            body: parsedBody,
            params: queryParams,
            skipAuth: !ep.requiresAuth
          });

          const duration = Math.round(performance.now() - startTime);

          metaContainer.innerHTML = `
            <span class="status-indicator-badge status-2xx">200 OK</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${duration} ms</span>
          `;

          responseOutput.textContent = JSON.stringify(data, null, 2);
          responseOutput.style.color = '#2d6a4f';
          toast.success(`[${ep.method}] ${resolvedPath} executed successfully`);

        } catch (err) {
          const duration = Math.round(performance.now() - startTime);
          const status = err.status || 500;

          metaContainer.innerHTML = `
            <span class="status-indicator-badge status-4xx">${status} ${err.message || 'Error'}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${duration} ms</span>
          `;

          responseOutput.textContent = JSON.stringify(err.response || { error: err.message, status }, null, 2);
          responseOutput.style.color = '#9e3a2b';
          toast.error(err.message || 'Request failed');

        } finally {
          executeBtn.disabled = false;
        }
      });
    }
  });
}
