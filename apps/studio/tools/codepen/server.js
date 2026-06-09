#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");
const { extractPen } = require("./extract");

const PORT = 3333;
const PENS_DIR = path.join(__dirname, "pens");
const DB_PATH = path.join(__dirname, "pens.json");

// --- Database helpers ---

function loadDb() {
  let db = { pens: {}, tags: [] };
  try {
    db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {}
  if (!db.pens) db.pens = {};
  if (!db.tags) db.tags = [];
  return syncPens(db);
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2) + "\n", "utf-8");
}

function syncPens(db) {
  try {
    const files = fs
      .readdirSync(PENS_DIR)
      .filter((f) => f.endsWith(".html"));
    for (const f of files) {
      if (!db.pens[f]) {
        db.pens[f] = {
          title: f
            .replace(/\.html$/, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          tags: [],
        };
      }
    }
    // Remove entries for files that no longer exist
    for (const f of Object.keys(db.pens)) {
      if (!fs.existsSync(path.join(PENS_DIR, f))) {
        delete db.pens[f];
      }
    }
  } catch {}
  saveDb(db);
  return db;
}

function listPens(db) {
  return Object.entries(db.pens)
    .map(([filename, data]) => ({
      filename,
      title: data.title,
      tags: data.tags || [],
      starred: !!data.starred,
      mtime: (() => {
        try {
          return fs.statSync(path.join(PENS_DIR, filename)).mtimeMs;
        } catch {
          return 0;
        }
      })(),
    }))
    // Starred pens float to the top; ties fall through to newest-first.
    .sort((a, b) => b.starred - a.starred || b.mtime - a.mtime);
}

// --- Request body parser ---

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// --- HTML UI ---

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodePen Extractor</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
    }
    .header {
      padding: 1rem 2rem;
      border-bottom: 1px solid #21262d;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header h1 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e6edf3;
      white-space: nowrap;
    }
    .header h1 span { color: #7ee787; }
    .extract-form {
      display: flex;
      gap: 0.5rem;
      flex: 1;
      max-width: 500px;
    }
    .extract-form input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #e6edf3;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .extract-form input:focus { border-color: #58a6ff; }
    .extract-form input::placeholder { color: #484f58; }
    .extract-form button {
      padding: 0.5rem 1rem;
      background: #238636;
      border: 1px solid #2ea043;
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .extract-form button:hover { background: #2ea043; }
    .extract-form button:disabled { opacity: 0.5; cursor: wait; }
    .status {
      font-size: 0.8rem;
      min-height: 1rem;
      white-space: nowrap;
    }
    .status.error { color: #f85149; }
    .status.success { color: #7ee787; }
    .status.loading { color: #79c0ff; }

    /* Filter dropdown */
    .filter-wrapper {
      position: relative;
    }
    .filter-btn {
      padding: 0.4rem 0.75rem;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .filter-btn:hover { background: #30363d; color: #e6edf3; }
    .filter-btn.has-filters { border-color: #1f6feb; color: #58a6ff; }
    .filter-btn .arrow { font-size: 0.6rem; }
    .filter-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      min-width: 180px;
      z-index: 50;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      padding: 0.5rem 0;
    }
    .filter-dropdown.open { display: block; }
    .filter-dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0.75rem 0.5rem;
      border-bottom: 1px solid #21262d;
      margin-bottom: 0.25rem;
    }
    .filter-dropdown-header span {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8b949e;
      font-weight: 600;
    }
    .filter-clear {
      background: none;
      border: none;
      color: #58a6ff;
      font-size: 0.7rem;
      cursor: pointer;
      padding: 0.1rem 0.25rem;
      border-radius: 3px;
    }
    .filter-clear:hover { text-decoration: underline; }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
      color: #c9d1d9;
      transition: background 0.1s;
    }
    .filter-item:hover { background: #21262d; }
    .filter-item input[type="checkbox"] {
      accent-color: #1f6feb;
      cursor: pointer;
    }
    .filter-empty {
      padding: 0.5rem 0.75rem;
      color: #484f58;
      font-size: 0.75rem;
      font-style: italic;
    }

    /* Tag bar */
    .tag-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 1rem 0.6rem calc(260px + 2rem);
      border-bottom: 1px solid #21262d;
      min-height: 42px;
    }
    .tag-bar-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      flex: 1;
    }
    .tag-bar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      margin-left: 1rem;
    }
    .tag-chip {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid #30363d;
      background: transparent;
      color: #8b949e;
      user-select: none;
    }
    .tag-chip.active {
      background: #1f6feb;
      border-color: #1f6feb;
      color: #fff;
    }
    .tag-chip:hover {
      border-color: #58a6ff;
      color: #e6edf3;
    }
    .tag-add {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      border: 1px solid #30363d;
      background: transparent;
      color: #8b949e;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      line-height: 1;
    }
    .tag-add:hover {
      border-color: #58a6ff;
      color: #e6edf3;
    }

    /* Layout */
    .content {
      display: flex;
      height: calc(100vh - 95px);
    }
    .sidebar {
      width: 260px;
      border-right: 1px solid #21262d;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .sidebar h2 {
      padding: 1rem 1rem 0.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #8b949e;
      font-weight: 600;
    }
    .sidebar ul { list-style: none; }
    .sidebar li a {
      display: block;
      padding: 0.45rem 1rem;
      color: #c9d1d9;
      text-decoration: none;
      font-size: 0.8rem;
      border-left: 2px solid transparent;
      transition: all 0.1s;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sidebar li a:hover {
      background: #161b22;
      color: #e6edf3;
    }
    .sidebar li a.active {
      border-left-color: #7ee787;
      background: #161b22;
      color: #7ee787;
    }

    /* Preview */
    .preview-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .code-btn {
      padding: 0.3rem 0.6rem;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #8b949e;
      font-size: 0.85rem;
      font-family: monospace;
      cursor: pointer;
      transition: all 0.15s;
    }
    .code-btn:hover {
      background: #30363d;
      color: #e6edf3;
    }
    .code-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .star-btn.active {
      color: #e3b341;
      border-color: #e3b341;
    }
    .delete-btn:hover {
      background: #f8514922;
      border-color: #f85149;
      color: #f85149;
    }
    .pen-star { color: #e3b341; }
    .preview {
      flex: 1;
      background: #161b22;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #fff;
    }
    .preview .empty {
      color: #484f58;
      font-size: 0.9rem;
    }

    /* Code modal */
    .code-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .code-modal-overlay.open { display: flex; }
    .code-modal {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      width: 90vw;
      height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .code-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #30363d;
    }
    .code-modal-header h3 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #e6edf3;
    }
    .code-modal-close {
      background: none;
      border: none;
      color: #8b949e;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: all 0.15s;
    }
    .code-modal-close:hover {
      background: #21262d;
      color: #e6edf3;
    }
    .code-modal-body {
      flex: 1;
      overflow: auto;
      padding: 0;
    }
    .code-modal-body pre {
      margin: 0;
      padding: 1rem 1.25rem;
      font-size: 0.8rem;
      line-height: 1.5;
      background: #0d1117 !important;
    }
    .code-modal-body code {
      font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    }

    /* Loading pulse */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .loading .status { animation: pulse 1.5s infinite; }
  </style>
</head>
<body>
  <div class="header">
    <h1><span>&#9998;</span> CodePen Extractor</h1>
    <form class="extract-form" id="form">
      <input type="url" id="url" placeholder="https://codepen.io/user/pen/abcdef" required autocomplete="off" />
      <button type="submit" id="btn">Extract</button>
    </form>
    <div class="status" id="status"></div>
  </div>

  <div class="tag-bar">
    <div class="tag-bar-left" id="tag-bar"></div>
    <div class="tag-bar-right">
      <div class="filter-wrapper">
        <button class="filter-btn" id="filter-btn">
          <span>Filter</span>
          <span class="arrow">&#9660;</span>
        </button>
        <div class="filter-dropdown" id="filter-dropdown"></div>
      </div>
      <button class="code-btn star-btn" id="star-btn" title="Star pen (pin to top)" disabled>&#9733;</button>
      <button class="code-btn" id="code-btn" title="View source code" disabled>&lt;/&gt;</button>
      <button class="code-btn delete-btn" id="delete-btn" title="Delete pen" disabled>&#128465;</button>
    </div>
  </div>

  <div class="content">
    <nav class="sidebar">
      <h2>Saved Pens</h2>
      <ul id="pen-list"></ul>
    </nav>
    <div class="preview-wrapper">
      <div class="preview" id="preview">
        <span class="empty">Paste a CodePen URL above to get started</span>
      </div>
    </div>
  </div>

  <!-- Code modal -->
  <div class="code-modal-overlay" id="code-modal">
    <div class="code-modal">
      <div class="code-modal-header">
        <h3 id="code-modal-title">Source Code</h3>
        <button class="code-modal-close" id="code-modal-close">&times;</button>
      </div>
      <div class="code-modal-body">
        <pre><code class="language-html" id="code-content"></code></pre>
      </div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
  <script>
    const form = document.getElementById("form");
    const urlInput = document.getElementById("url");
    const btn = document.getElementById("btn");
    const statusEl = document.getElementById("status");
    const preview = document.getElementById("preview");
    const penList = document.getElementById("pen-list");
    const tagBar = document.getElementById("tag-bar");
    const codeBtn = document.getElementById("code-btn");
    const codeModal = document.getElementById("code-modal");
    const codeModalClose = document.getElementById("code-modal-close");
    const codeModalTitle = document.getElementById("code-modal-title");
    const codeContent = document.getElementById("code-content");
    const filterBtn = document.getElementById("filter-btn");
    const filterDropdown = document.getElementById("filter-dropdown");
    const starBtn = document.getElementById("star-btn");
    const deleteBtn = document.getElementById("delete-btn");

    let currentFile = null;
    let allPens = [];
    let allTags = [];
    let filterTags = new Set();

    function setStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = "status " + (type || "");
      document.body.className = type === "loading" ? "loading" : "";
    }

    function getCurrentPenTags() {
      if (!currentFile) return [];
      const pen = allPens.find(p => p.filename === currentFile);
      return pen ? pen.tags : [];
    }

    function renderTagBar() {
      const penTags = getCurrentPenTags();
      const chips = allTags.map(tag => {
        const active = penTags.includes(tag);
        return '<button class="tag-chip' + (active ? ' active' : '') + '" data-tag="' + tag + '">' + tag + '</button>';
      }).join("");
      const addBtn = '<button class="tag-add" id="add-tag-btn" title="Create new tag">+</button>';
      tagBar.innerHTML = chips + addBtn;
    }

    function showPen(filename) {
      currentFile = filename;
      preview.innerHTML = '<iframe src="/pens/' + filename + '"></iframe>';
      codeBtn.disabled = false;
      deleteBtn.disabled = false;
      starBtn.disabled = false;
      const pen = allPens.find(p => p.filename === filename);
      starBtn.classList.toggle("active", !!(pen && pen.starred));
      document.querySelectorAll(".sidebar a").forEach(a => {
        a.classList.toggle("active", a.dataset.file === filename);
      });
      renderTagBar();
    }

    function clearSelection() {
      currentFile = null;
      preview.innerHTML = '<span class="empty">Paste a CodePen URL above to get started</span>';
      codeBtn.disabled = true;
      starBtn.disabled = true;
      deleteBtn.disabled = true;
      starBtn.classList.remove("active");
      renderTagBar();
    }

    function renderPenList() {
      const filtered = filterTags.size === 0
        ? allPens
        : allPens.filter(p => p.tags.some(t => filterTags.has(t)));
      penList.innerHTML = filtered.map(p =>
        '<li><a href="#" data-file="' + p.filename + '"' +
        (p.filename === currentFile ? ' class="active"' : '') +
        '>' + (p.starred ? '<span class="pen-star">&#9733;</span> ' : '') + p.title + '</a></li>'
      ).join("");
    }

    function renderFilterDropdown() {
      if (allTags.length === 0) {
        filterDropdown.innerHTML = '<div class="filter-empty">No tags created yet</div>';
        return;
      }
      const header = '<div class="filter-dropdown-header"><span>Filter by tag</span>' +
        '<button class="filter-clear" id="filter-clear">Clear all</button></div>';
      const items = allTags.map(tag => {
        const checked = filterTags.has(tag) ? ' checked' : '';
        return '<label class="filter-item"><input type="checkbox" data-tag="' + tag + '"' + checked + '>' + tag + '</label>';
      }).join("");
      filterDropdown.innerHTML = header + items;
      filterBtn.classList.toggle("has-filters", filterTags.size > 0);
    }

    async function loadPenList() {
      const res = await fetch("/api/pens");
      const data = await res.json();
      allPens = data.pens;
      allTags = data.tags;
      renderPenList();
      renderTagBar();
      renderFilterDropdown();
    }

    // Sidebar click
    penList.addEventListener("click", (e) => {
      e.preventDefault();
      const a = e.target.closest("a");
      if (!a) return;
      showPen(a.dataset.file);
    });

    // Tag bar clicks
    tagBar.addEventListener("click", async (e) => {
      const chip = e.target.closest(".tag-chip");
      const addBtn = e.target.closest("#add-tag-btn");

      if (chip && currentFile) {
        const tag = chip.dataset.tag;
        const penTags = getCurrentPenTags();
        const action = penTags.includes(tag) ? "remove" : "add";
        await fetch("/api/pens/" + encodeURIComponent(currentFile) + "/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag, action }),
        });
        // Update local state
        const pen = allPens.find(p => p.filename === currentFile);
        if (pen) {
          if (action === "add") pen.tags.push(tag);
          else pen.tags = pen.tags.filter(t => t !== tag);
        }
        renderTagBar();
      }

      if (addBtn) {
        const name = prompt("New tag name:");
        if (!name || !name.trim()) return;
        const trimmed = name.trim().toLowerCase();
        if (allTags.includes(trimmed)) return;
        await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        allTags.push(trimmed);
        renderTagBar();
      }
    });

    // Filter dropdown
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle("open");
    });
    filterDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      const checkbox = e.target.closest('input[type="checkbox"]');
      const clearBtn = e.target.closest("#filter-clear");
      if (checkbox) {
        const tag = checkbox.dataset.tag;
        if (checkbox.checked) filterTags.add(tag);
        else filterTags.delete(tag);
        filterBtn.classList.toggle("has-filters", filterTags.size > 0);
        renderPenList();
      }
      if (clearBtn) {
        filterTags.clear();
        renderFilterDropdown();
        renderPenList();
      }
    });
    document.addEventListener("click", () => {
      filterDropdown.classList.remove("open");
    });

    // Code viewer
    codeBtn.addEventListener("click", async () => {
      if (!currentFile) return;
      const res = await fetch("/api/pens/" + encodeURIComponent(currentFile) + "/code");
      const code = await res.text();
      const pen = allPens.find(p => p.filename === currentFile);
      codeModalTitle.textContent = pen ? pen.title : "Source Code";
      codeContent.textContent = code;
      Prism.highlightElement(codeContent);
      codeModal.classList.add("open");
    });

    // Star / unstar the selected pen (pins it to the top of the list)
    starBtn.addEventListener("click", async () => {
      if (!currentFile) return;
      const pen = allPens.find(p => p.filename === currentFile);
      const newStarred = !(pen && pen.starred);
      await fetch("/api/pens/" + encodeURIComponent(currentFile) + "/star", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });
      starBtn.classList.toggle("active", newStarred);
      // Reload so the server re-sorts; currentFile keeps the pen highlighted.
      await loadPenList();
    });

    // Delete the selected pen (removes the file + its record)
    deleteBtn.addEventListener("click", async () => {
      if (!currentFile) return;
      const pen = allPens.find(p => p.filename === currentFile);
      const title = pen ? pen.title : currentFile;
      if (!confirm('Delete "' + title + '"? This removes the file from pens/ (shared, committed source).')) return;
      await fetch("/api/pens/" + encodeURIComponent(currentFile), { method: "DELETE" });
      clearSelection();
      await loadPenList();
    });

    codeModalClose.addEventListener("click", () => {
      codeModal.classList.remove("open");
    });
    codeModal.addEventListener("click", (e) => {
      if (e.target === codeModal) codeModal.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") codeModal.classList.remove("open");
    });

    // Extract form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const url = urlInput.value.trim();
      if (!url) return;

      btn.disabled = true;
      setStatus("Extracting pen...", "loading");

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Extraction failed");

        setStatus("Extracted: " + data.title, "success");
        await loadPenList();
        showPen(data.filename);
        urlInput.value = "";
      } catch (err) {
        setStatus(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    loadPenList();
  </script>
</body>
</html>`;

// --- HTTP Server ---

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve the UI
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
    return;
  }

  // List pens with tags
  if (req.method === "GET" && url.pathname === "/api/pens") {
    const db = loadDb();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ pens: listPens(db), tags: db.tags }));
    return;
  }

  // Get pen source code
  if (req.method === "GET" && url.pathname.match(/^\/api\/pens\/(.+)\/code$/)) {
    const filename = decodeURIComponent(url.pathname.match(/^\/api\/pens\/(.+)\/code$/)[1]);
    const filePath = path.join(PENS_DIR, path.basename(filename));
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File not found" }));
    }
    return;
  }

  // Delete a pen (file + record)
  if (req.method === "DELETE" && url.pathname.match(/^\/api\/pens\/([^/]+)$/)) {
    const filename = decodeURIComponent(url.pathname.match(/^\/api\/pens\/([^/]+)$/)[1]);
    const safe = path.basename(filename);
    const filePath = path.join(PENS_DIR, safe);

    const db = loadDb();
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    // Drop the record explicitly so pens.json is correct immediately
    // (syncPens would prune it on the next read, but don't rely on that).
    delete db.pens[safe];
    saveDb(db);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Toggle tag on a pen
  if (req.method === "PUT" && url.pathname.match(/^\/api\/pens\/(.+)\/tags$/)) {
    const filename = decodeURIComponent(url.pathname.match(/^\/api\/pens\/(.+)\/tags$/)[1]);
    const body = JSON.parse(await readBody(req));
    const { tag, action } = body;

    const db = loadDb();
    if (!db.pens[filename]) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Pen not found" }));
      return;
    }

    const penTags = db.pens[filename].tags || [];
    if (action === "add" && !penTags.includes(tag)) {
      penTags.push(tag);
    } else if (action === "remove") {
      db.pens[filename].tags = penTags.filter((t) => t !== tag);
    }
    if (action === "add") db.pens[filename].tags = penTags;
    saveDb(db);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, tags: db.pens[filename].tags }));
    return;
  }

  // Set starred state on a pen (pins it to the top of the list)
  if (req.method === "PUT" && url.pathname.match(/^\/api\/pens\/(.+)\/star$/)) {
    const filename = decodeURIComponent(url.pathname.match(/^\/api\/pens\/(.+)\/star$/)[1]);
    const body = JSON.parse(await readBody(req));
    const starred = !!body.starred;

    const db = loadDb();
    if (!db.pens[filename]) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Pen not found" }));
      return;
    }

    // Only persist when true — omit the field otherwise to keep pens.json minimal.
    if (starred) db.pens[filename].starred = true;
    else delete db.pens[filename].starred;
    saveDb(db);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, starred }));
    return;
  }

  // Create a new tag
  if (req.method === "POST" && url.pathname === "/api/tags") {
    const body = JSON.parse(await readBody(req));
    const name = (body.name || "").trim().toLowerCase();
    if (!name) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Tag name required" }));
      return;
    }

    const db = loadDb();
    if (!db.tags.includes(name)) {
      db.tags.push(name);
      saveDb(db);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, tags: db.tags }));
    return;
  }

  // Extract a pen
  if (req.method === "POST" && url.pathname === "/api/extract") {
    try {
      const body = JSON.parse(await readBody(req));
      const result = await extractPen(body.url);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Serve pen files
  if (req.method === "GET" && url.pathname.startsWith("/pens/")) {
    const filePath = path.join(PENS_DIR, path.basename(url.pathname));
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
      };
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`CodePen Extractor running at http://localhost:${PORT}`);
});
