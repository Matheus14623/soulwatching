const fs = require("fs");
const path = require("path");

const [docxPath, jszipScriptPath, previewScriptPath, outputPdf, playwrightRoot, chromePath] = process.argv.slice(2);
if (![docxPath, jszipScriptPath, previewScriptPath, outputPdf, playwrightRoot, chromePath].every(Boolean)) {
  throw new Error(
    "Usage: node _qa_render_docx_browser.cjs <docx> <jszip.min.js> <docx-preview.min.js> <output.pdf> <playwright-root> <chrome.exe>"
  );
}

const { chromium } = require(playwrightRoot);

(async () => {
  fs.mkdirSync(path.dirname(outputPdf), { recursive: true });
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--disable-gpu", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    await page.setContent(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <style>
            html, body { margin: 0; padding: 0; background: #fff; }
            #render { margin: 0; padding: 0; }
            .docx-wrapper { background: #fff !important; padding: 0 !important; }
            .docx-wrapper > section.docx {
              box-shadow: none !important;
              margin: 0 auto !important;
              break-after: page;
              page-break-after: always;
            }
            .docx-wrapper > section.docx:last-child {
              break-after: auto;
              page-break-after: auto;
            }
            @media print {
              .docx-wrapper > section.docx { margin: 0 !important; }
            }
          </style>
        </head>
        <body><main id="render"></main></body>
      </html>`);
    await page.addScriptTag({ path: jszipScriptPath });
    await page.addScriptTag({ path: previewScriptPath });
    const base64 = fs.readFileSync(docxPath).toString("base64");
    await page.evaluate(async (payload) => {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      await window.docx.renderAsync(bytes.buffer, document.getElementById("render"), null, {
        inWrapper: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        renderComments: false,
        useBase64URL: true,
      });
      await document.fonts.ready;
    }, base64);
    await page.emulateMedia({ media: "print" });
    const sections = await page.locator("section.docx").count();
    const metrics = await page.locator("section.docx").evaluateAll((nodes) =>
      nodes.map((node, index) => ({
        index: index + 1,
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      }))
    );
    await page.pdf({
      path: outputPdf,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    console.log(JSON.stringify({ sections, metrics, outputPdf }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
