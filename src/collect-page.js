/**
 * Evidence collector injected into the active tab after the toolbar click.
 * It must stay self-contained: Chrome serializes this function alone.
 * Network: three unauthenticated same-origin GETs (page URL, /robots.txt, /llms.txt).
 */
export async function collectPageEvidence() {
  async function readSameOrigin(url, target, prefix) {
    const statusKey = `${prefix}Status`;
    const textKey = `${prefix}Txt`;
    const errorKey = `${prefix}Error`;
    try {
      const response = await fetch(url, { credentials: "omit", cache: "no-store", redirect: "follow" });
      let finalOrigin = "";
      try {
        finalOrigin = new URL(response.url).origin;
      } catch {
        finalOrigin = "";
      }
      if (finalOrigin && finalOrigin !== location.origin) {
        target[errorKey] = "The request left this origin, so the body was not read.";
        target[statusKey] = response.status;
        return;
      }
      target[statusKey] = response.status;
      target[textKey] = response.status === 200 ? await response.text() : null;
    } catch (error) {
      target[errorKey] = error instanceof Error ? error.message : String(error);
    }
  }

  const pageUrl = location.href;
  const evidence = {
    pageUrl,
    renderedHtml: document.documentElement
      ? `<!DOCTYPE html>\n${document.documentElement.outerHTML}`
      : "",
    rawHtml: null,
    rawStatus: null,
    rawError: null,
    xRobotsTag: null,
    robotsTxt: null,
    robotsStatus: null,
    robotsError: null,
    llmsTxt: null,
    llmsStatus: null,
    llmsError: null,
  };

  try {
    const response = await fetch(pageUrl, { credentials: "omit", cache: "no-store", redirect: "follow" });
    evidence.rawStatus = response.status;
    evidence.xRobotsTag = response.headers.get("x-robots-tag");
    let finalOrigin = "";
    try {
      finalOrigin = new URL(response.url).origin;
    } catch {
      finalOrigin = "";
    }
    if (finalOrigin && finalOrigin !== location.origin) {
      evidence.rawError = "The refetch left this origin, so the body was not read.";
    } else {
      evidence.rawHtml = await response.text();
    }
  } catch (error) {
    evidence.rawError = error instanceof Error ? error.message : String(error);
  }

  await readSameOrigin(new URL("/robots.txt", location.origin).href, evidence, "robots");
  await readSameOrigin(new URL("/llms.txt", location.origin).href, evidence, "llms");
  return evidence;
}
