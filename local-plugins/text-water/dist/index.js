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

// pages in a folder, newest first (frontmatter `year` or `date`), then by `order`, then by title
function pagesIn(allFiles, folder) {
  return allFiles
    .filter((f) => f.slug?.startsWith(folder + "/") && !f.slug.endsWith("/index") && f.frontmatter?.draft !== true)
    .map((f) => ({ slug: f.slug, ast: f.htmlAst, order: Number(f.frontmatter?.order ?? 99), title: f.frontmatter?.title ?? f.slug, when: String(f.frontmatter?.year ?? f.frontmatter?.date ?? ""), note: f.frontmatter?.description ?? "" }))
    .sort((a, b) => b.when.localeCompare(a.when) || a.order - b.order || a.title.localeCompare(b.title))
}

function List({ from, title, id, pages }) {
  return jsxs("section", { id, class: "listing", children: [
    jsx("h2", { children: title }),
    jsx("ul", { children: pages.flatMap((p) => [
      jsxs("li", { class: "row", children: [
        jsx("a", { class: "name internal", href: resolveRelative(from, p.slug), children: p.title }),
        jsx("span", { class: "dots", "aria-hidden": "true" }),
        jsx("span", { class: "year", children: p.when.slice(0, 10) }),
      ] }),
      p.note ? jsx("li", { class: "note", children: p.note }) : null,
    ]) }),
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
      jsx(List, { from: slug, title: "Projects", id: "projects", pages: pagesIn(allFiles, "projects") }),
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
  Component.afterDOMLoaded = script + "\n" + captions
  return Component
}
export default TextWater
