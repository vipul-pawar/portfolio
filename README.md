# Vipul Pawar — Portfolio

Static multi-page portfolio for **Vipul Pawar**, Instrumentation, Control & Automation Engineering student
(Government College of Engineering, Amravati, 2023–2027).

Plain HTML + Tailwind CSS (compiled by the Tailwind CLI into a single `css/output.css`) + small vanilla JS.
No framework, no router, no runtime dependency. It works on any static host and when opened straight from disk.

---

## Quick start

### Option A — with Node.js installed (recommended)

```bash
npm install        # installs tailwindcss 3.4.17 (the only dev dependency)
npm run dev        # rebuild css/output.css on every change while you edit
npm run build      # one-off minified production build
npm run serve      # optional: static server on http://localhost:4173
```

### Option B — without Node.js

The compiled `css/output.css` is committed, so the site already works as-is. To rebuild it you have two choices:

- Install Node.js (LTS) from <https://nodejs.org>, then follow Option A.
- Or use the standalone Tailwind CLI — no Node required:

  1. Download `tailwindcss-windows-x64.exe` from the
     [Tailwind CSS v3.4.17 release](https://github.com/tailwindlabs/tailwindcss/releases/tag/v3.4.17).
  2. Run it from the project folder:

     ```powershell
     .\tailwindcss.exe -i .\css\input.css -o .\css\output.css --watch
     .\tailwindcss.exe -i .\css\input.css -o .\css\output.css --minify
     ```

     In this working copy the CLI already sits at `.tools\tailwindcss.exe`. `.tools/` is git-ignored, so a
     fresh clone will not contain it.

You only need a build step if you change markup that uses Tailwind classes you have not used before, or if you
edit the design tokens in `css/input.css` / `tailwind.config.js`.

### Looking at the site

Just open `index.html` in a browser. Everything except the web fonts works offline; the fonts are loaded from
Google Fonts and fall back to the system sans/mono stack when you are offline.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Watches all HTML + JS and rebuilds `css/output.css` on change |
| `npm run build` | Minified production build into `css/output.css` |
| `npm run serve` | Serves the folder on port 4173 (`npx serve`) for local checking |

---

## Structure

```
/
├── index.html                       Home: hero, about summary, preview cards
├── projects.html                    Filterable project grid (PLC / Embedded-IoT / Web / Security)
├── projects/
│   ├── voter-authentication.html    Feb–May 2026 · ESP32, QR + fingerprint, Google Apps Script
│   ├── plc-pneumatic-control.html   Apr 2026 · PLC ladder, 5 s off-delay, electro-pneumatics
│   ├── sonicradar.html              Apr 2025 · HC-SR04 on a servo, Processing visualisation
│   ├── pictale.html                 Jun 2025 · Django photo/video CRUD app
│   └── emi-calculator.html          Jan 2025 · Django loan EMI calculator
├── experience/
│   └── reliance-internship.html     Jun–Aug 2026 · Reliance Industries, Navi Mumbai (high level)
├── skills.html                      Five control-panel style skill modules
├── certifications.html              Eleven certificates in six groups + education timeline
├── pid-lab.html                     Interactive PID tuning simulator
├── contact.html                     Channels + a form that composes a mailto link
├── 404.html                         "Loop not found"
├── css/
│   ├── input.css                    Design tokens + component classes (edit this)
│   └── output.css                   Compiled Tailwind output (generated — do not edit)
├── js/
│   ├── layout.js                    Renders the header, footer, skip link and lightbox
│   ├── theme.js                     Light/dark controller (localStorage + system preference)
│   └── pid.js                       Canvas PID simulator for pid-lab.html
├── assets/                          SVG placeholders, favicon, avatar, resume PDF
├── tailwind.config.js               Theme: ink / paper / signal / go palettes, fonts, shadows
└── package.json                     Tailwind CLI scripts
```

---

## How it works

### Theme, without a flash

Every page carries the same small inline script in `<head>`. It reads `vp-theme` from `localStorage` inside a
`try/catch`, falls back to `prefers-color-scheme`, and sets `.dark` on `<html>` **before** the first paint.
`js/theme.js` handles the toggle button afterwards (it is delegated, so it keeps working if the header markup is
re-rendered), writes the choice back to `localStorage` and fires a `vp:themechange` event — `js/pid.js` listens
for it so the chart recolours immediately.

### Shared header and footer

`js/layout.js` builds the navbar, the mobile hamburger menu, the theme toggle, the footer (with the
"system status: online" LED) and a `<dialog>` lightbox from template strings — no `fetch`, so it also works from
`file://`. Pages declare two attributes on `<body>`:

```html
<body data-root="./" data-page="projects.html">
```

- `data-root` is the prefix every generated link gets. Root pages use `./`; pages inside `projects/` or
  `experience/` use `../`.
- `data-page` is matched against the nav rules to mark the current item with `aria-current="page"`.

To change the navigation, edit the `NAV` array in `js/layout.js`; to change the email or social URLs, edit `SOCIAL`
in the same file.

### Scroll reveal

Elements with `class="reveal"` fade in when they enter the viewport (IntersectionObserver in `js/layout.js`).
The animation only exists when JavaScript is on, and it is skipped entirely under `prefers-reduced-motion: reduce`.

### PID lab

`js/pid.js` simulates a first-order-plus-dead-time process (K = 1, τ = 6 s, θ = 1.2 s) against a parallel-form PID
controller with derivative-on-measurement and conditional-integration anti-windup. It draws three trends (setpoint,
process variable, controller output) on a plain canvas, reading its colours from the `--chart-*` CSS variables, and
reports overshoot, settling time, rise time and steady-state error. Nothing is fetched and no chart library is used.

---

## Deployment

### GitHub Pages (free)

1. Create a repository and push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Portfolio site"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

2. In the repository: **Settings → Pages**.
3. Under **Build and deployment → Source** choose *Deploy from a branch*, then pick the branch `main` and the
   folder `/ (root)`. Save.
4. Wait for the first build; the site appears at `https://<user>.github.io/<repo>/`.

Notes:

- For a **user site** (repository named `<user>.github.io`) the site is served from the domain root and all
  relative links work as they are.
- For a **project site** (`/<repo>/`) everything still works, because `data-root="./"` links are relative. The only
  exception is `404.html`: the host returns it for *any* missing address, so it also carries a root-absolute
  fallback for its CSS/JS. If you deploy under a sub-path and want that fallback to work too, adjust the `/` in the
  two fallback blocks in `404.html` to `/<repo>/`.
- No build step is required on the host — `css/output.css` is committed.

### Netlify (free)

1. Drag the whole folder onto <https://app.netlify.com/drop>, or connect the Git repository.
2. Build command: leave empty. Publish directory: `.` (the repository root).
3. `404.html` is picked up automatically as the not-found page.

---

## Placeholders to replace

The site uses only documented facts, so a few items are deliberately marked in the pages themselves as
`TODO: add detail from README`. They are:

| Where | What |
| --- | --- |
| `assets/vipul-pawar-resume.pdf` | A minimal one-page placeholder — replace it with the real resume (keep the file name) |
| `assets/placeholder-*.svg` | Generic diagram/screenshot art — replace with real diagrams and photographs where you have them |
| Each project page | Part numbers, wiring/ladder details and gallery captions that were not in the source notes |
| `experience/reliance-internship.html` | Non-confidential detail only — nothing proprietary, no confidential plant data |
| `certifications.html` | School completion year and any academic distinctions |
| `pid-lab.html` | Optional link to a real tuning exercise (for example a Ziegler–Nichols walkthrough) |

Replacing an image is a two-step edit: drop the new file into `assets/` and update the `src`/`data-full`
attributes on the gallery `<button>` in the relevant page.

---

## Accessibility and conventions

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `<h1>` per page, labelled sections.
- Visible focus rings everywhere, a skip link to `#main`, `aria-label`s on icon-only controls and a live region
  for the PID metrics.
- Colour contrast is checked in both themes; the chart, LEDs and grid use theme-aware variables.
- Images are lazy-loaded (`loading="lazy"`, `decoding="async"`) with width/height set to avoid layout shift.
- Every page has a unique `<title>`, meta description and Open Graph tags.
