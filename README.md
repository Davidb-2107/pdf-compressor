# PDF Compressor

Browser-based application to reduce PDF file size while preserving visual quality. All processing happens locally in your browser—no files are ever uploaded to a server.

---

## 1. Project Overview
PDF Compressor is a React + TypeScript web app that lets users drag-and-drop a PDF, pick compression settings and immediately download a smaller file.  
It was designed for:

* Data privacy – everything runs client-side  
* Simplicity – no account, no ads, no limits  
* Cross-platform use – works in any modern desktop browser

---

## 2. Features
| Feature | Description |
|---------|-------------|
| 🖱️ Drag & drop | Drop a single PDF or click to browse |
| 🎚️ Compression options | Choose **Low**, **Medium**, **High** level, adjust quality slider (10-100 %) and toggle *Preserve Text Quality* |
| 📊 Progress feedback | Linear progress bar + percentage |
| 📉 Size comparison | Shows original vs compressed size and % reduction |
| 📥 One-click download | Generates `<filename>-compressed.pdf` |
| 🔒 Local processing | Uses `pdf-lib` in the browser – no server side code |

---

## 3. Installation

```bash
# 1. Clone
git clone https://github.com/<your-org>/pdf-compressor.git
cd pdf-compressor

# 2. Install dependencies
npm install            # or yarn

# 3. Run in development mode
npm start              # open http://localhost:3000
```

Production build:

```bash
npm run build          # outputs optimized static files in ./build
```

You can then serve the `build` folder with any static host (Netlify, Vercel, GitHub Pages, S3, etc.).

### 3.1 Local preview / quick deploy

If you just want to spin-up a local web-server to validate the production build, a _deploy_ script is provided:

```bash
# Build and immediately serve on http://localhost:8080
npm run deploy:build

# (or) if you already have a ./build folder
npm run deploy            # serves ./build

# options
node deploy.js --port 9000 --host 0.0.0.0 --open false
```

The script uses **express** to serve the static files and (by default) opens your browser automatically.

---

## 4. Usage Guide

1. **Open the app** in your browser.  
2. **Drag & drop** a PDF (or click the drop zone and select one).  
3. **Set compression options**  
   * Compression Level: Low / Medium / High  
   * Quality Slider: fine-tune output quality  
   * Preserve Text Quality: keeps text sharp when enabled  
4. Click **“Compress PDF”**.  
5. Watch the progress bar; when finished, review the size reduction report.  
6. Click **“Download Compressed PDF”**.  
7. To process another file, press **“Compress Another PDF”**.

---

## 5. Technical Implementation

| Stack layer | Libraries / Tools | Notes |
|-------------|-------------------|-------|
| UI | React 18 + TypeScript, **MUI** (Material UI) | Responsive components, themeable |
| File input | **react-dropzone** | Drag-and-drop with file type validation |
| PDF processing | **pdf-lib** | Loads, manipulates and saves PDFs directly in browser memory |
| Download | **file-saver** | Creates a Blob download |
| State & effects | React hooks (`useState`, `useCallback`, `useEffect`) | Handles progress simulation and cleanup |
| Styling | MUI + custom CSS | Dropzone styling, animations, scrollbar |
| Build | CRA (Create-React-App) with TypeScript template | Easy local dev & production build |

| PDF processing | **pdf-lib + Web Worker pipeline** | Executes *real* optimisation (metadata removal, object-stream compression and optional image down-sampling) off-main-thread |

### Compression engine  
Compression now happens in a dedicated **Web Worker**.  
The worker:
1. Loads the document with `pdf-lib`  
2. Strips metadata & thumbnails, optimises object streams  
3. Optionally down-samples embedded images based on the quality slider  
4. Saves with aggressive compression flags  
This provides genuine file-size reduction while keeping every byte of processing in the browser.

---

## 6. Future Improvements

* 🔧 **Real compression engine** – WebAssembly (e.g. wasm-pdfium) or small serverless API for Ghostscript/qpdf  
* 📂 **Batch processing** – multiple PDFs at once, zip download  
* 🔐 **Password-protected PDFs** – prompt for password, re-encrypt after compression  
* 💾 **Offline PWA** – add service worker & manifest for installable app  
* 🌗 **Dark mode & theming** – utilise MUI’s theme switcher  
* 🌍 **i18n support** – translate UI strings with `react-i18next`  
* 🧪 **Unit/E2E tests** – Jest, React Testing Library, Playwright  
* 📈 **Analytics opt-in** – understand usage without compromising privacy  

---

### License
[MIT](LICENSE)

Enjoy faster, smaller PDFs! 🚀
