# GEO Checker self-test

Date (Asia/Shanghai): 2026-10-27
Recorded at: 2026-10-27, 10:02:31 (Asia/Shanghai)

Method: Chrome on this machine opened each URL, ran `collectPageEvidence` in the page (same-origin refetch, `/robots.txt`, `/llms.txt`), then ran `checkPage` from `src/checker.js`. The popup screenshot is `popup.html` rendered with that JSON result. Scores below were produced by that run. Rows marked not captured have no score.

This is not a substitute for clicking the toolbar icon on your own machine. Load unpacked steps are in the README. If a live site blocked the cloud VM, the attempt log says so and the score cell is empty.

| # | Category | URL | Date | Score | Fails | Screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | GitHub Pages | https://2045shane.github.io/ai-demos/ | 2026-10-27 | 61/100 | C06, C07, C08, C09 | testdata/screenshots/self-test/01-2045shane-github-io.png |
| 2 | Big site | https://developer.mozilla.org/en-US/docs/Web/HTML | 2026-10-27 | 64/100 | C06, C07, C09 | testdata/screenshots/self-test/02-developer-mozilla-org.png |
| 3 | Big site | https://en.wikipedia.org/wiki/Robots.txt | 2026-10-27 | 76/100 | C04, C07 | testdata/screenshots/self-test/03-en-wikipedia-org.png |
| 4 | Big site | https://www.nasa.gov/ | 2026-10-27 | 64/100 | C05, C07, C09 | testdata/screenshots/self-test/04-www-nasa-gov.png |
| 5 | Small blog | https://jvns.ca/ | 2026-10-27 | 36/100 | C02, C05, C06, C07, C08, C09 | testdata/screenshots/self-test/05-jvns-ca.png |
| 6 | Small blog | https://overreacted.io/ | 2026-10-27 | 36/100 | C04, C05, C06, C07, C08, C09 | testdata/screenshots/self-test/06-overreacted-io.png |
| 7 | Small blog | https://danluu.com/ | 2026-10-27 | 24/100 | C01, C04, C05, C06, C07, C08, C09 | testdata/screenshots/self-test/07-danluu-com.png |
| 8 | Competitor | https://geochecker.app/ | 2026-10-27 | 64/100 | C05, C07, C09 | testdata/screenshots/self-test/08-geochecker-app.png |
| 9 | Competitor | https://geochecker.net/ | 2026-10-27 | 64/100 | C01, C07, C09 | testdata/screenshots/self-test/09-geochecker-net.png |
| 10 | Competitor | https://otterly.ai/ | 2026-10-27 | 24/100 | C02, C03, C04, C06, C07, C08, C09 | testdata/screenshots/self-test/10-otterly-ai.png |

## Attempt log

### 1. GitHub Pages

- Captured: https://2045shane.github.io/ai-demos/
- Title: AI替我说 · AI 互动小实验合集
- Score: 61/100
- Fails: C06, C07, C08, C09
- JSON: testdata/self-test/01-2045shane-github-io.json
- Screenshot: testdata/screenshots/self-test/01-2045shane-github-io.png
- Attempt https://2045shane.github.io/: http-error — HTTP 404
- Attempt https://2045shane.github.io/ai-demos/: captured

### 2. Big site

- Captured: https://developer.mozilla.org/en-US/docs/Web/HTML
- Title: HTML: HyperText Markup Language | MDN
- Score: 64/100
- Fails: C06, C07, C09
- JSON: testdata/self-test/02-developer-mozilla-org.json
- Screenshot: testdata/screenshots/self-test/02-developer-mozilla-org.png
- Attempt https://developer.mozilla.org/en-US/docs/Web/HTML: captured

### 3. Big site

- Captured: https://en.wikipedia.org/wiki/Robots.txt
- Title: robots.txt - Wikipedia
- Score: 76/100
- Fails: C04, C07
- JSON: testdata/self-test/03-en-wikipedia-org.json
- Screenshot: testdata/screenshots/self-test/03-en-wikipedia-org.png
- Attempt https://en.wikipedia.org/wiki/Robots.txt: captured

### 4. Big site

- Captured: https://www.nasa.gov/
- Title: NASA
- Score: 64/100
- Fails: C05, C07, C09
- JSON: testdata/self-test/04-www-nasa-gov.json
- Screenshot: testdata/screenshots/self-test/04-www-nasa-gov.png
- Attempt https://www.nasa.gov/: captured

### 5. Small blog

- Captured: https://jvns.ca/
- Title: Julia Evans
- Score: 36/100
- Fails: C02, C05, C06, C07, C08, C09
- JSON: testdata/self-test/05-jvns-ca.json
- Screenshot: testdata/screenshots/self-test/05-jvns-ca.png
- Attempt https://jvns.ca/: captured

### 6. Small blog

- Captured: https://overreacted.io/
- Title: overreacted — A blog by Dan Abramov
- Score: 36/100
- Fails: C04, C05, C06, C07, C08, C09
- JSON: testdata/self-test/06-overreacted-io.json
- Screenshot: testdata/screenshots/self-test/06-overreacted-io.png
- Attempt https://overreacted.io/: captured

### 7. Small blog

- Captured: https://danluu.com/
- Title: 
- Score: 24/100
- Fails: C01, C04, C05, C06, C07, C08, C09
- JSON: testdata/self-test/07-danluu-com.json
- Screenshot: testdata/screenshots/self-test/07-danluu-com.png
- Attempt https://danluu.com/: captured

### 8. Competitor

- Captured: https://geochecker.app/
- Title: GEO Checker — AI visibility scans, monitoring and reports
- Score: 64/100
- Fails: C05, C07, C09
- JSON: testdata/self-test/08-geochecker-app.json
- Screenshot: testdata/screenshots/self-test/08-geochecker-app.png
- Attempt https://geochecker.app/: captured

### 9. Competitor

- Captured: https://geochecker.net/
- Title: GEO Checker | AI Search Visibility Tool
- Score: 64/100
- Fails: C01, C07, C09
- JSON: testdata/self-test/09-geochecker-net.json
- Screenshot: testdata/screenshots/self-test/09-geochecker-net.png
- Attempt https://geochecker.net/: captured

### 10. Competitor

- Captured: https://otterly.ai/
- Title: Robot Challenge Screen
- Score: 24/100
- Fails: C02, C03, C04, C06, C07, C08, C09
- JSON: testdata/self-test/10-otterly-ai.json
- Screenshot: testdata/screenshots/self-test/10-otterly-ai.png
- Attempt https://otterly.ai/: captured

