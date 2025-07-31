**Eleventy-Based Documentation MVP for axmdev.app**

---

### 🔄 Goal

Create a unified, lightweight documentation site for open-source packages (npm, Docker, PHP) published under the `axmdev.app` domain, starting with `tagged-keyv-wrapper`. The site should be fast, SEO-friendly, and easy to extend with AI-generated Markdown docs.

---

### ✅ Stack Decision

* **Static Site Generator:** Eleventy (11ty)
* **Docs Format:** Markdown (`.md`) with frontmatter
* **Styling:** Custom CSS or Tailwind (optional)
* **Hosting:** GitHub Pages or Vercel
* **Search:** Initially Fuse.js (local JSON index), optional future switch to Algolia DocSearch

---

### 📄 Docs Folder Structure

```
docs/
├── .eleventy.js            ← Eleventy config
├── package.json            ← Build/dev scripts
├── index.md                ← Main documentation page
├── _includes/
│   └── layout.njk          ← Base HTML layout
├── _data/
│   └── site.json           ← Global metadata (optional)
└── static/                 ← Images, logos (optional)
```

---

### ⚡ Setup Steps

1. `npm init -y && npm install @11ty/eleventy --save-dev`
2. Add build scripts to `package.json`
3. Create `.eleventy.js` with dir config + passthroughs
4. Add layout in `_includes/layout.njk`
5. Write docs in `index.md` using frontmatter
6. Run `npm run start` for local preview
7. Deploy via GitHub Pages or Vercel (root = `docs/`, output = `_site`)

---

### 💡 Planned Content for Each Project

* Why this was built
* What it does
* Who benefits from it
* Installation & dependencies
* Quick Start
* Usage
* API reference
* Code quality badges (CI, coverage, etc.)
* License
* Contributing instructions
* Code of Conduct
* Help Wanted section (GitHub Issues integration)
* Sponsorship links (GitHub Sponsors, Patreon)

---

### 🔍 Search Options

1. **Fuse.js:** local search index (`search-index.json`)
2. **Algolia DocSearch:** free for OSS, requires approval
3. **Lunr.js:** alternative to Fuse.js (larger)

---

### 📅 Next Steps

* ✅ Build Eleventy MVP inside `tagged-keyv-wrapper`
* ✅ Add content to `index.md`
* ✅ Create layout template
* ⬆ Add GitHub issues integration for Help Wanted section
* Ἑ5 Optionally style with Tailwind or custom CSS
* ἱ0 Deploy and link from axmdev.app/docs/tagged-keyv-wrapper

---

Let me know when you’re ready to build the search index, add deployment automation, or generate `.md` files with AI!
