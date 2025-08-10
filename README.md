# My Embroidery (GitHub Pages Ready)

This is a static web app for managing embroidery floss inventory and wishlist.
It includes:
- DMC / COSMO / Olympus makers
- Unified "yarn ball" visuals (SVG)
- Quantity control (「－ 数字 ＋」 format)
- Wishlist (heart) and wishlist-only view
- 100s index jump (e.g., 100 / 200 / 300...)

## Quick Start (GitHub Pages)
1. Create a **new public repository** on GitHub (e.g., `my-embroidery`).
2. Upload all files in this folder to the repository root (drag & drop via web UI is OK).
3. Commit to `main` (default branch).
4. Go to **Settings → Pages**:
   - *Build and deployment* → **Source: Deploy from a branch**
   - **Branch: main** and **/ (root)**, then Save.
5. Wait ~1–2 minutes. Your site will be live at:
   - `https://<your-username>.github.io/<repo-name>/`

> Tip: If you see a 404 initially, wait a moment and refresh. GitHub Pages may take a minute.

## Data
Color data live in `/data/*.json`. You can replace these with full datasets later.
See `data/DATA_GUIDE.md` for the schema and how to expand.

## Local Testing
Open `index.html` directly in a browser. Some browsers restrict `fetch` on local files.
If you need to test locally, run a simple server:
```
python3 -m http.server 8080
```
Then open `http://localhost:8080`.
