# ernjg.github.io

Personal site, built with [Quartz](https://quartz.jzhao.xyz/). Live at [ernjg.github.io](https://ernjg.github.io).

Pages live in `content/`. See `SITE.md` for how things are organized.
The `quartz/` folder is the Quartz engine itself, MIT licensed (see `quartz/LICENSE.txt`).

```sh
npm ci
npx quartz plugin install --from-config
npx quartz build --serve   # http://localhost:8080
```
