# Design & more Admin Dashboard

A responsive admin dashboard built with vanilla JavaScript and Vite. It supports English and Arabic, light and dark themes, and authenticated administration of orders, products, categories, delivery fees, reviews, custom orders, advertisements, users, and contact messages.

## Backend

The default API is **https://design-more.onrender.com**. Sign in with an administrator account created on the backend. Contact messages show a total-count badge in the sidebar, refreshed every 30 seconds.

## Local development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To override the backend, copy `.env.example` to `.env` and change `VITE_API_BASE_URL`, then restart Vite. API settings in the dashboard can also override the host; saving an empty value restores the default.

```sh
npm test
npm run build
npm run preview
```

The production bundle is generated in `dist/`.

## GitHub Pages deployment

1. Create a GitHub repository and push this project's source to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included workflow runs tests, builds the dashboard, and deploys `dist/` on pushes to `main`. Pull requests only run tests and build checks.
4. Open the published URL shown in the workflow's deployment. Hash routes, such as `#/messages`, work under repository subpaths.

Workflow setup follows the [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Render configuration

Add the deployed frontend's origin to the backend's allowed origins. For example, set `AllowedOrigins__0=https://YOUR_USERNAME.github.io` in Render. Use the origin only, without a repository path or trailing slash. Preserve any existing origins using the next available index, then redeploy the backend. A custom domain must have its own allowed-origin entry.

The backend must allow authorization and content-type headers for browser requests. Apply its `AddContactMessages` database migration before using the inbox. SMTP settings and `Contact__RecipientEmail` belong on the backend.

## Repository contents

Source code, tests, assets, deployment configuration, and this README are included. `.gitignore` excludes other Markdown files, `docs/`, dependencies, build output, screenshots, backend patch files, local environment files, and logs. Local documentation is preserved on disk.

Frontend `VITE_*` values are public configuration. Keep passwords, SMTP credentials, database connections, and signing keys on the backend.
