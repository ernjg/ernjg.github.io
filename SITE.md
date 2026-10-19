# Ernesto's site (Quartz 5)

custom:

- The pages live in the Obsidian vault, in its `Site/` folder (repo `ernjg/E1-vault`, private); this repo has no
  `content/`. Pushing the vault triggers a rebuild here (`.github/workflows/site.yml` in the vault pings
  `deploy.yml`, which checks the vault out with the `VAULT_TOKEN` secret and builds `-d vault/Site`).
  Below, `content/` means that `Site/` folder. `index.md` is the home page (its body is the About section).
  Adding a project: `content/projects/<name>.md` with `title`, `date` (a full date, `2026-03-01`, so Obsidian's date
  picker works; only the year is shown on the site), `description`.
  Projects can also set `label` (research, industry, academic, teaching, personal, or free text;
  shown as a colored `[label]` before the year; colors per kind are at the top of the label rules in `style.css`)
  and `featured: true` (listed first, with a `*` before the name).
  Under the Projects heading is a filter row (`all`, the known kinds listed above, then any other label in use) that
  shows only the matching projects. The known kinds are set in `KNOWN_LABELS` at the top of `dist/index.js`.
  The list is sorted featured first, then newest `date`, then title. The `description` is hidden until the
  row is hovered (or its link focused), then pops up under it; on touch screens a tap on the row opens it.
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
    SITE_EMAIL=you@example.com npm run dev    # preview at http://localhost:8080 (builds ../E1/Site)
    npm run build                             # static output in public/; then node tools/static-links.mjs if needed
    npx quartz build -d <folder>              # build any other content folder