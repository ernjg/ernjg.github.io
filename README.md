# ernjg.github.io

Personal site, built with [Quartz](https://quartz.jzhao.xyz/). Live at [ernjg.github.io](https://ernjg.github.io).

The pages are written in an Obsidian vault and live in its private repo; pushing the vault rebuilds the site here.
To do the same for your own site, fork this repo, point `.github/workflows/deploy.yml` at your vault's repo and content
folder, and copy the vault-side trigger workflow described in `SITE.md`. `npx quartz build -d <folder>` builds from any folder.
The `quartz/` folder is the Quartz engine itself, MIT licensed (see `quartz/LICENSE.txt`).

```sh
npm ci
npx quartz plugin install --from-config
npx quartz build --serve -d <content folder>   # http://localhost:8080
```
