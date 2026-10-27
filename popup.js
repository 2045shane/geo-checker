import { collectPageEvidence } from "./src/collect-page.js";
import { checkPage } from "./src/checker.js";
import { renderReport } from "./src/render.js";

const app = document.querySelector("#app");

if (globalThis.__GEO_PREVIEW_RESULT__) {
  renderReport(app, globalThis.__GEO_PREVIEW_RESULT__);
} else {
  runLive().catch((error) => {
    app.textContent = `GEO Checker hit an unexpected error. ${error instanceof Error ? error.message : String(error)}`;
  });
}

async function runLive() {
  if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) {
    app.textContent = "Open GEO Checker from the toolbar icon on an http or https page.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    app.textContent = "No active tab to check.";
    return;
  }
  if (tab.url && !/^https?:/i.test(tab.url)) {
    app.textContent = "Open an http or https page, then click the GEO Checker icon. Browser pages cannot be checked.";
    return;
  }

  let evidence;
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectPageEvidence,
    });
    evidence = injection?.result;
  } catch (error) {
    app.textContent = `Could not read this tab. Open an http or https page and try again. ${error instanceof Error ? error.message : ""}`;
    return;
  }

  if (!evidence?.renderedHtml) {
    app.textContent = "This tab did not return HTML.";
    return;
  }

  const rendered = new DOMParser().parseFromString(evidence.renderedHtml, "text/html");
  const raw = evidence.rawHtml ? new DOMParser().parseFromString(evidence.rawHtml, "text/html") : null;
  renderReport(app, checkPage(rendered, { ...evidence, rawDocument: raw }));
}
