// Home page component: the tagline, the text water, and lists of projects and notes built from
// the markdown files in content/projects and content/notes. The gallery collects every captioned
// image on the site's project and note pages (markdown `![caption](path)`); each tile shows the page's
// title and date and opens that page (the caption stays with the image on its page).
// Other pages get a link home.
import { readFileSync } from "fs"
import { jsx, jsxs } from "preact/jsx-runtime"
import { resolveRelative, pathToRoot } from "@quartz-community/utils"

const script = readFileSync(new URL("./water.js", import.meta.url), "utf-8")
const css = readFileSync(new URL("./style.css", import.meta.url), "utf-8")

// pages in a folder: featured first, then newest (frontmatter `year` or `date`; placeholders like "[YEAR]" last),
// then by `order`, then by title. Projects may also carry a `label` (research, industry, academic, teaching, personal, or free text),
// shown as a colored [label] before the year; the span carries data-label so labels can later be used to filter the list.
const sortKey = (when) => (/^\d/.test(when) ? when : "")

function pagesIn(allFiles, folder) {
  return allFiles
    .filter((f) => f.slug?.startsWith(folder + "/") && !f.slug.endsWith("/index") && f.frontmatter?.draft !== true)
    .map((f) => ({ slug: f.slug, ast: f.htmlAst, order: Number(f.frontmatter?.order ?? 99), title: f.frontmatter?.title ?? f.slug, when: String(f.frontmatter?.year ?? f.frontmatter?.date ?? ""), note: f.frontmatter?.description ?? "", label: String(f.frontmatter?.label ?? "").trim(), featured: f.frontmatter?.featured === true }))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || sortKey(b.when).localeCompare(sortKey(a.when)) || a.order - b.order || a.title.localeCompare(b.title))
}

// label filter buttons under a list heading: "all", the known kinds (always, in this order), then any other label in use
const KNOWN_LABELS = ["research", "industry", "academic", "teaching", "personal"]
function Filters({ pages }) {
  const used = [...new Set(pages.map((p) => p.label.toLowerCase()).filter(Boolean))]
  const labels = [...KNOWN_LABELS, ...used.filter((l) => !KNOWN_LABELS.includes(l))]
  return jsx("p", { class: "filters", role: "group", "aria-label": "Show projects labeled", children: ["all", ...labels].map((l) =>
    jsx("button", { type: "button", "data-filter": l, "aria-pressed": l === "all" ? "true" : "false", children: l })) })
}

function List({ from, title, id, pages, filters = false }) {
  return jsxs("section", { id, class: "listing", children: [
    jsx("h2", { children: title }),
    filters ? jsx(Filters, { pages }) : null,
    jsx("ul", { children: pages.map((p) =>
      jsxs("li", { class: "entry", "data-label": p.label.toLowerCase(), children: [
        jsxs("div", { class: "row", children: [
          jsx("a", { class: "name internal", href: resolveRelative(from, p.slug), children: p.featured ? "* " + p.title : p.title }),
          jsx("span", { class: "dots", "aria-hidden": "true" }),
          p.label ? jsx("span", { class: "label", "data-label": p.label.toLowerCase(), children: "[" + p.label + "]" }) : null,
          jsx("span", { class: "year", children: p.when.slice(0, 10) }),
        ] }),
        p.note ? jsx("p", { class: "note", children: p.note }) : null,
      ] })) }),
  ] })
}

// tabs between the home page and the gallery; the current one is bracketed
function Tabs({ from, current }) {
  const tab = (slug, label) => jsx("a", { href: resolveRelative(from, slug), "aria-current": current === slug ? "page" : undefined, children: label })
  return jsxs("nav", { class: "tabs", children: [tab("index", "home"), tab("gallery", "gallery")] })
}

// every <img> with alt text in a page, as { src (from the site root), caption }
function captionedImages(page) {
  const found = []
  const walk = (node) => {
    if (node.type === "element" && node.tagName === "img" && node.properties?.alt && !/^https?:/.test(node.properties.src ?? "")) {
      const parts = [...page.slug.split("/").slice(0, -1), ...String(node.properties.src).split("/")]
      const path = []
      for (const part of parts) part === ".." ? path.pop() : part && part !== "." && path.push(part)
      found.push({ src: path.join("/"), caption: String(node.properties.alt) })
    }
    for (const child of node.children ?? []) walk(child)
  }
  if (page.ast) walk(page.ast)
  return found
}

function Gallery({ from, pages }) {
  const root = pathToRoot(from)
  const tiles = pages.flatMap((p) => captionedImages(p).map((img) => ({ ...img, page: p })))
  return jsx("div", { class: "gallery", children: tiles.map(({ src, caption, page }) =>
    jsxs("a", { class: "tile", href: resolveRelative(from, page.slug), children: [
      jsx("img", { src: `${root}/${src}`, alt: caption, loading: "lazy" }),
      jsxs("span", { class: "label", children: [page.title, jsx("span", { class: "year", children: page.when.slice(0, 10) })] }),
    ] })) })
}

export function TextWater() {
  const Component = ({ fileData, allFiles }) => {
    const slug = fileData.slug
    if (slug === "gallery") {
      return jsxs("div", { class: "home", children: [
        jsxs("header", { class: "home-head", children: [
          jsx("h1", { children: "Ernesto Gomez" }),
          jsx(Tabs, { from: slug, current: "gallery" }),
        ] }),
        jsx(Gallery, { from: slug, pages: [...pagesIn(allFiles, "projects"), ...pagesIn(allFiles, "notes")].sort((a, b) => b.when.localeCompare(a.when)) }),
      ] })
    }
    if (slug !== "index") {
      return jsx("p", { class: "home-link", children: jsx("a", { href: resolveRelative(slug, "index"), children: "← Ernesto Gomez" }) })
    }
    return jsxs("div", { class: "home", children: [
      jsxs("header", { class: "home-head", children: [
        jsx("h1", { children: fileData.frontmatter?.title }),
        fileData.frontmatter?.description ? jsx("p", { class: "tagline", children: fileData.frontmatter.description }) : null,
        jsx(Tabs, { from: slug, current: "index" }),
      ] }),
      jsxs("section", { class: "water", "aria-label": "Light through water", children: [
        jsx("pre", { id: "water", "aria-label": "Sunlight through rippling water, drawn in characters. Move the mouse over it to make ripples." }),
        jsxs("p", { class: "cap", children: [
          jsx("span", { id: "sunline", children: "sunlight through water, live over San Antonio" }),
          jsxs("span", { class: "modes", role: "group", "aria-label": "Drawn with", children: [
            jsx("button", { type: "button", id: "m-ascii", "aria-pressed": "true", children: "ascii" }),
            jsx("button", { type: "button", id: "m-braille", "aria-pressed": "false", children: "braille" }),
          ] }),
        ] }),
      ] }),
      jsx(List, { from: slug, title: "Projects", id: "projects", pages: pagesIn(allFiles, "projects"), filters: true }),
      jsx(List, { from: slug, title: "Notes", id: "notes", pages: pagesIn(allFiles, "notes") }),
    ] })
  }
  Component.css = css
  // on project and note pages, show each image's caption under it (the same text the gallery uses)
  const captions = `for (const img of document.querySelectorAll("article img[alt]")) {
    if (!img.alt || img.closest("figure")) continue
    const fig = document.createElement("figure"), cap = document.createElement("figcaption")
    cap.textContent = img.alt
    img.replaceWith(fig); fig.append(img, cap)
  }`
  // label filter buttons: show only the entries whose data-label matches
  const filtering = `for (const group of document.querySelectorAll(".listing .filters")) {
    const items = group.parentElement.querySelectorAll("li[data-label]")
    group.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filter]")
      if (!b) return
      for (const o of group.querySelectorAll("button")) o.setAttribute("aria-pressed", String(o === b))
      for (const li of items) li.hidden = b.dataset.filter !== "all" && li.dataset.label !== b.dataset.filter
    })
  }`
  // on touch screens there is no hover: tapping a row anywhere but its title link opens that description (and closes others)
  const tapping = `for (const row of document.querySelectorAll(".listing .row")) row.addEventListener("click", (e) => {
    if (e.target.closest("a")) return
    const entry = row.parentElement, open = entry.classList.contains("open")
    for (const o of entry.parentElement.querySelectorAll("li.open")) o.classList.remove("open")
    if (!open) entry.classList.add("open")
  })`
  Component.afterDOMLoaded = script + "\n" + captions + "\n" + filtering + "\n" + tapping
  return Component
}
export default TextWater
