#!/usr/bin/env node

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const PENS_DIR = path.join(__dirname, "pens");

function toSnakeCase(title) {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function validateUrl(url) {
  const match = url.match(
    /codepen\.io\/([^/]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+)/
  );
  if (!match) return null;
  return {
    penUrl: `https://codepen.io/${match[1]}/pen/${match[2]}`,
    user: match[1],
    penId: match[2],
  };
}

function usesESModules(js) {
  return /\b(import\s+[\s\S]*?from\s+['"]|import\s+['"]|export\s+(default|const|let|var|function|class|async\s+function|\{))/m.test(js);
}

function buildHtml({ title, html, css, js, externalCss, externalJs }) {
  const cssLinks = externalCss
    .map((url) => `  <link rel="stylesheet" href="${url}">`)
    .join("\n");

  const jsScripts = externalJs
    .map((url) => `  <script src="${url}"><\/script>`)
    .join("\n");

  const styleBlock = css.trim() ? `  <style>\n${css}\n  </style>` : "";

  const scriptType = usesESModules(js) ? ' type="module"' : '';
  const jsBlock = js.trim() ? `  <script${scriptType}>\n${js}\n  <\/script>` : "";

  const sections = [
    `<!DOCTYPE html>`,
    `<html lang="en">`,
    `<head>`,
    `  <meta charset="UTF-8">`,
    `  <meta name="viewport" content="width=device-width, initial-scale=1.0">`,
    `  <title>${title}</title>`,
    cssLinks,
    styleBlock,
    `</head>`,
    `<body>`,
    html.trim(),
    jsScripts,
    jsBlock,
    `</body>`,
    `</html>`,
  ];

  return sections.filter(Boolean).join("\n") + "\n";
}

async function extractPen(url) {
  const parsed = validateUrl(url);
  if (!parsed) {
    throw new Error(
      "Invalid CodePen URL. Expected format: https://codepen.io/{user}/pen/{id}"
    );
  }

  const { penUrl } = parsed;
  console.log(`Navigating to ${penUrl}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );

  try {
    await page.goto(penUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for CodeMirror editors to initialize
    await page.waitForSelector("#box-html .CodeMirror", { timeout: 15000 });

    // Extract title, HTML code, and external resources from the editor page.
    // HTML is always extracted from the editor (no HTML preprocessors produce
    // different output structure — Pug/Haml/etc still output HTML in the editor).
    const editorData = await page.evaluate(() => {
      const titleEl = document.querySelector("#editable-title-span");
      const title = titleEl
        ? titleEl.textContent.trim()
        : document.title.replace(/ - CodePen$/, "").trim();

      const getCode = (boxId) => {
        const cm = document.querySelector(`#${boxId} .CodeMirror`);
        return cm && cm.CodeMirror ? cm.CodeMirror.getValue() : "";
      };

      // Detect preprocessors via "View Compiled" buttons
      const preprocessors = {};
      for (const type of ["html", "css", "js"]) {
        const btn = document.querySelector(`#view-compiled-${type}`);
        preprocessors[type] = btn && !btn.classList.contains("hide");
      }

      const externalCss = Array.from(
        document.querySelectorAll("input.css-resource.external-resource")
      )
        .map((el) => el.value.trim())
        .filter(Boolean);

      const externalJs = Array.from(
        document.querySelectorAll("input.js-resource.external-resource")
      )
        .map((el) => el.value.trim())
        .filter(Boolean);

      return {
        title,
        html: getCode("box-html"),
        css: getCode("box-css"),
        js: getCode("box-js"),
        externalCss,
        externalJs,
        preprocessors,
      };
    });

    const hasPreprocessors = Object.values(editorData.preprocessors).some(
      Boolean
    );

    // If preprocessors are used, get compiled CSS/JS from the preview iframe.
    // CodePen's preview iframe already contains the server-compiled output.
    if (hasPreprocessors) {
      const preTypes = Object.entries(editorData.preprocessors)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase());
      console.log(`Preprocessor detected for: ${preTypes.join(", ")}...`);
      console.log("Extracting compiled output from preview iframe...");

      // Wait for the preview iframe to load
      await page.waitForSelector("#result", { timeout: 10000 });

      const resultFrame = page
        .frames()
        .find((f) => f.name() === "CodePen");

      if (resultFrame) {
        // Wait for the iframe content to be ready
        await resultFrame.waitForSelector("body", { timeout: 10000 });

        const iframeData = await resultFrame.evaluate(() => {
          // Compiled CSS: grab all <style> tags in the iframe (skip empty ones)
          const styles = Array.from(document.querySelectorAll("style"))
            .map((el) => el.textContent.trim())
            .filter(Boolean);

          // Compiled JS: CodePen puts the pen JS in <script id="rendered-js">
          const renderedJs = document.querySelector("#rendered-js");
          const js = renderedJs ? renderedJs.textContent.trim() : "";

          // Compiled HTML: get the body innerHTML but strip scripts and styles
          const bodyClone = document.body.cloneNode(true);
          bodyClone
            .querySelectorAll("script, style, link[rel='stylesheet']")
            .forEach((el) => el.remove());
          const html = bodyClone.innerHTML.trim();

          return { css: styles.join("\n\n"), js, html };
        });

        // Override preprocessed fields with compiled versions
        if (editorData.preprocessors.css && iframeData.css) {
          editorData.css = iframeData.css;
        }
        if (editorData.preprocessors.js && iframeData.js) {
          // Strip the sourceURL comment CodePen adds
          editorData.js = iframeData.js.replace(
            /\n?\/\/#\s*sourceURL=pen\.js\s*$/,
            ""
          );
        }
        if (editorData.preprocessors.html && iframeData.html) {
          editorData.html = iframeData.html;
        }
      } else {
        console.warn(
          "Warning: Could not access preview iframe. Using raw source code."
        );
      }
    }

    await browser.close();

    console.log(`Title: ${editorData.title}`);
    console.log(
      `HTML: ${editorData.html.length} chars | CSS: ${editorData.css.length} chars | JS: ${editorData.js.length} chars`
    );
    console.log(
      `External CSS: ${editorData.externalCss.length} | External JS: ${editorData.externalJs.length}`
    );

    const outputHtml = buildHtml(editorData);
    const filename = toSnakeCase(editorData.title) + ".html";
    const outputPath = path.join(PENS_DIR, filename);

    fs.mkdirSync(PENS_DIR, { recursive: true });
    fs.writeFileSync(outputPath, outputHtml, "utf-8");

    // Upsert entry in pens.json database
    const dbPath = path.join(__dirname, "pens.json");
    let db = { pens: {}, tags: [] };
    try {
      db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch {}
    if (!db.pens[filename]) {
      db.pens[filename] = { title: editorData.title, tags: [] };
    } else {
      db.pens[filename].title = editorData.title;
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + "\n", "utf-8");

    console.log(`Saved: ${outputPath}`);
    return { filename, title: editorData.title, outputPath };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = { extractPen };

// CLI entry point
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node extract.js <codepen-url>");
    console.error(
      "Example: node extract.js https://codepen.io/GreenSock/pen/emNjgpy"
    );
    process.exit(1);
  }

  extractPen(url)
    .then(({ filename }) => console.log(`\nDone: ${filename}`))
    .catch((err) => {
      console.error(`Failed: ${err.message}`);
      process.exit(1);
    });
}
