// Footer, one line: contact links on the left; the theme switch and a credit to Quartz on the right.
// The site is dark unless the visitor picks light.
import { jsx, jsxs } from "preact/jsx-runtime"

// runs before the page paints: picks the theme (no flash of the wrong one) and loads IBM Plex Mono
// in the weights the site uses (Quartz's own font link only has 400, 600 and 700)
const before = `
  document.documentElement.setAttribute("saved-theme", localStorage.getItem("theme") === "light" ? "light" : "dark")
  const font = document.createElement("link")
  font.rel = "stylesheet"
  font.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&display=swap"
  document.head.appendChild(font)
`

const after = `
  // email: the address is stored reversed in data attributes and assembled here, so it never
  // appears as plain text in the HTML that scrapers read
  for (const a of document.querySelectorAll("a.email")) {
    const rev = (s) => [...s].reverse().join("")
    a.href = "mailto:" + rev(a.dataset.u) + "@" + rev(a.dataset.d)
  }
  const btns = [...document.querySelectorAll(".theme-switch button")]
  const show = (t) => btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === t)))
  show(document.documentElement.getAttribute("saved-theme"))
  btns.forEach((b) => b.addEventListener("click", () => {
    const t = b.dataset.t
    document.documentElement.setAttribute("saved-theme", t)
    try { localStorage.setItem("theme", t) } catch (e) {}
    show(t)
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: t } }))
  }))
`

const css = `
.site-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.4em 2ch; margin: 2.4em 0 4.5em; font-size: 13px; color: var(--gray); }
.site-footer p { margin: 0; }
.theme-switch { display: inline-flex; gap: 1ch; }
.theme-switch button { font: inherit; color: var(--gray); background: none; border: 0; padding: 0; cursor: pointer; }
.theme-switch button[aria-pressed="true"] { color: var(--dark); }
.theme-switch button[aria-pressed="true"]::before { content: "["; }
.theme-switch button[aria-pressed="true"]::after { content: "]"; }
`

export function SiteFooter(opts) {
  const links = Object.entries(opts?.links ?? {})
  const rev = (s) => [...s].reverse().join("")
  // The address comes from the SITE_EMAIL environment variable (a GitHub Actions secret in CI)
  // so it never has to be written into a committed file. opts.email still works as an override.
  const [user, domain] = (opts?.email || process.env.SITE_EMAIL || "").split("@")
  const Component = () => jsxs("footer", { class: "site-footer", children: [
    jsx("p", { children: [
      user && domain ? jsx("a", { class: "email", href: "#", "data-u": rev(user), "data-d": rev(domain), children: "email" }) : null,
      ...links.flatMap(([text, href], i) => [i || (user && domain) ? " · " : null, href ? jsx("a", { href, children: text }) : text]),
    ] }),
    jsxs("p", { class: "right", children: [
      jsxs("span", { class: "theme-switch", role: "group", "aria-label": "Color theme", children: [
        jsx("button", { type: "button", "data-t": "dark", "aria-pressed": "true", children: "dark" }),
        jsx("button", { type: "button", "data-t": "light", "aria-pressed": "false", children: "light" }),
      ] }),
      " \u00b7 built with ", jsx("a", { href: "https://quartz.jzhao.xyz", children: "Quartz" }),
    ] }),
  ] })
  Component.css = css
  Component.beforeDOMLoaded = before
  Component.afterDOMLoaded = after
  return Component
}
export default SiteFooter
