// After `npx quartz build`: Quartz links pages without ".html" (e.g. ./projects/asktim), which
// needs a host that adds the extension. This rewrites internal links in public/ to point at the
// actual files, so the site also works on plain static hosting. Run: node tools/static-links.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "fs"
import { join, dirname, resolve } from "path"

const root = resolve("public")
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
for (const file of walk(root).filter((f) => f.endsWith(".html"))) {
  const html = readFileSync(file, "utf8").replace(/href="(\.{1,2}\/[^"#?]*)([#?][^"]*)?"/g, (m, path, rest = "") => {
    const target = resolve(dirname(file), path)
    if (existsSync(target + ".html")) return `href="${path}.html${rest}"`
    if (existsSync(join(target, "index.html"))) return `href="${path.replace(/\/?$/, "/")}index.html${rest}"`
    return m
  })
  writeFileSync(file, html)
}
