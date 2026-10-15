# Ernesto's site (Quartz 5)

custom:

- `content/` — the pages. `index.md` is the home page (its body is the About section).
  Adding a project: `content/projects/<name>.md` with `title`, `year`, `description` (and optional `order`).
  Adding a note: `content/notes/<name>.md` with `title`, `date`, `description`. Both appear on the home page lists.
  Put images next to the page (e.g. `content/notes/images/`) and embed them with a caption to add them to the gallery.
- `local-plugins/text-water/` — the home page component: the text water (`dist/water.js`, all settings at the top),
  its styles (`dist/style.css`), and the project and note lists (`dist/index.js`). Other pages get a link home.
- `local-plugins/site-footer/` — footer links and the dark/light switch (dark by default). The email
  (read from the `SITE_EMAIL` environment variable; a GitHub Actions secret in CI) is written into the page reversed and assembled by script,
  so it never appears as plain text for scrapers.
- `content/gallery.md` — the gallery page. It collects every image on a project or note page that has a caption,
  written as `![caption](images/foo.png)`; each tile opens that page. An image with no caption (`![](...)`) stays off it.
- `quartz.config.yaml` — site title, fonts, colors, which Quartz plugins are on; footer links are set here.
- `quartz/styles/custom.scss` — the plain single-column layout.
- `tools/static-links.mjs` — run after building if your host doesn't add ".html" to links.

Commands:

    npm ci
    npx quartz plugin install --from-config
    SITE_EMAIL=you@example.com npx quartz build --serve   # preview at http://localhost:8080
    npx quartz build && node tools/static-links.mjs   # static output in public/