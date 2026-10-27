import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

export function startPreviewServer(root) {
  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const relative = decodeURIComponent(url.pathname);
    const file = path.resolve(root, `.${relative}`);
    if (relative !== "/" && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403);
      response.end();
      return;
    }
    const target = relative === "/" ? path.join(root, "popup.html") : file;
    if (!existsSync(target) || !target.startsWith(root)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, { "content-type": TYPES[path.extname(target)] || "application/octet-stream" });
    response.end(readFileSync(target));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        origin: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

export async function screenshotReport(browser, origin, result, file) {
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((preview) => {
    window.__GEO_PREVIEW_RESULT__ = preview;
  }, result);
  await page.goto(`${origin}/popup.html`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#check-C10");
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}
