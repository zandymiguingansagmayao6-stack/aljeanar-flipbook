# 📖 FlipBook — PDF to Flipbook Viewer

A lightweight, browser-based PDF flipbook viewer. Upload any PDF and flip through it like a real book — no backend, no account, no uploads to any server.

## ✨ Features

- Drag & drop or click to upload any PDF
- Two-page spread layout (like a real book)
- Page thumbnail navigation
- Zoom in / out
- Keyboard navigation (← → arrow keys)
- Fully client-side — your PDF never leaves your device

## 🚀 Getting Started

### Option 1 — Open directly in browser

Just open `index.html` in any modern browser. No server needed.

### Option 2 — Run with a local server (recommended)

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.

### Option 3 — Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Your flipbook will be live at `https://yourusername.github.io/your-repo-name`

## 📁 Project Structure

```
flipbook-app/
├── index.html   # Main HTML — upload screen + viewer layout
├── style.css    # All styles
├── app.js       # PDF loading, rendering, navigation logic
└── README.md    # This file
```

## 🛠️ Built With

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla — PDF rendering in the browser
- Vanilla HTML, CSS, JavaScript — no framework needed

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` | Next spread |
| `←` | Previous spread |
| `+` | Zoom in |
| `-` | Zoom out |

## 📄 License

MIT — free to use, modify, and distribute.
