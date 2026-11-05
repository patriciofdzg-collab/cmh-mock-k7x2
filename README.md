# Client Manager HUB — interactive mockup (build 1)

Static site (HTML + CSS + JS, no build step, no server, no database). Data lives in the browser's `localStorage`.
**Demo only:** passwords are stored in plain text in the browser. Use fictional data.

## Run it locally
Double-click `index.html`. Works offline.

## Publish on GitHub Pages (no terminal needed)
1. On github.com click **New repository**. Pick a neutral name (e.g. `cm-hub-mock`). Public is required on free plans for Pages.
2. In the empty repo choose **Add file → Upload files**, drag the *contents* of this folder (`index.html`, `css/`, `js/`, `README.md`) and commit.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder = `/ (root)`. Save.
4. After about a minute the site is live at `https://<your-user>.github.io/<repo-name>/`.

Notes
- A GitHub Pages site is **public** to anyone with the URL, even if the repo is private on some plans. The framework text is client content, so keep the repo name non-obvious and enter only fictional data. `index.html` has `noindex` so search engines should skip it.
- To move it to the client's account later: **Settings → Transfer** the repo, or create a new repo there and upload the same files. Nothing in the code depends on your account or repo name (all paths are relative).

## Demo accounts (password: `demo`)
| User | Notes |
|---|---|
| alex.rivera@demo.com | Senior Client Manager, full sample history (2 self-assessments, manager ×2, peer ×1) |
| jordan.lee@demo.com | Manager of Alex, empty account |
| sam.patel@demo.com | Peer, empty account |
| maya.chen@demo.com | Delivery lead, empty account |

You can also register a new account, then use **Load sample history** on the empty dashboard. The top-right user menu has **Switch user** and **Reset demo data**.

## What is in build 1
Sign in / register · profile · self-assessment (52 skills, autosaved drafts, N/A option, notes, review and submit) · history of evaluations about you and by you with compare · dashboard (radar, focus areas, pillars, insights, perception gaps, level distribution, changes, progress) · framework reference.

## Next build
Invitations and access requests (view / evaluate), relationship declaration, evaluating others, reconcile-and-agree flow with notes, permissions.

## Files
- `js/framework.js` — pillars, dimensions, skills, level descriptions (English, client-agnostic)
- `js/store.js` — scoring (`Calc`), demo data (`Seed`), localStorage database (`Store`)
- `js/ui.js` — helpers and SVG charts · `js/views.js` — screens · `js/app.js` — routing and events
- `css/styles.css` — color scheme taken from the maturity-model deck
