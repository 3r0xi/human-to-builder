# Human → Builder

An interactive portfolio for **Ercan Osman Orhan**: from a first GPT-2 experiment to AI-assisted media pipelines, approval-led operations, and Shopify-native commerce.

## Experience

- A responsive, dark-green/cyan/orange visual identity.
- A procedural canvas city that assembles as the visitor scrolls and reverses on the way back.
- A reconstructed first-contact terminal with three interactive prompts.
- Five journey chapters and four detailed project case files.
- A small workflow simulation with clean-run, quality-issue, and recovery scenarios.
- A concise recruiter view and a print stylesheet for saving that view as PDF.
- A credited, click-to-load 3Blue1Brown video with a direct YouTube fallback.
- Keyboard navigation, visible focus styles, reduced-motion support, and a motion toggle.

The site is buildless HTML, CSS, and JavaScript. No framework, package installation, API key, paid inference, or server is required.

## Publish on GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose **main** and **/(root)**, then **Save**.
4. Wait for GitHub's Pages deployment to succeed and use the URL returned by GitHub.

The expected project URL is https://3r0xi.github.io/human-to-builder/ — this is not a claim that it is live. A GitHub Pages site from a **private** repository requires GitHub Pro or another eligible paid GitHub plan. Keep the repository private unless the owner deliberately chooses otherwise.

This chat's GitHub connection can commit source but does not expose a Pages-settings operation; the owner must enable that setting.

Official instructions:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

The earlier ChatGPT Sites project is separate. This repository does not deploy to or modify that project's publication.

## Edit

| File | Purpose |
| --- | --- |
| index.html | Structure and static introduction |
| assets/styles.css | Layout, typography, responsiveness, print styles |
| assets/app.js | Case files, timeline, navigation, terminal, workflow, video |
| assets/city.js | Procedural city rendering |
| assets/content.js | Curated chapter, project, and capability text |
| assets/favicon.svg | Site icon |
| assets/social-card.svg | Editable vector share-card design |
| assets/social-card.png | Raster share card for social platforms |
| scripts/check-site.mjs | Dependency-free source checks |

Relative paths support GitHub Pages project hosting. Google Fonts is an optional visual enhancement; system fallbacks are provided. The page does not load a YouTube player until the visitor presses play.

## Check

With Node.js 22 or newer, run:

~~~sh
node scripts/check-site.mjs
~~~

The GitHub Actions check, when available to this repository connection, runs this command on pushes and pull requests. It checks JavaScript syntax, content contracts, local references, accessibility basics, and obvious private-data leakage. These checks do not replace real visual and interactive browser QA.

## Content boundaries

This is a curated portfolio, not a complete ChatGPT activity export. The full account-wide history was not available during preparation.

Project descriptions were grounded in the owner's recollection and selected project documentation reviewed in October 2026. The Python local media worker, Node.js V2 staging system, and prepared Shopify storefront are described separately. This portfolio does not claim live autonomous publishing, a publicly launched storefront, formal qualifications, client results, or current test totals.

The first-contact dialogue, city, diagrams, and workflow simulation are illustrative. The external film belongs to 3Blue1Brown / Grant Sanderson; it is not presented as the portfolio owner's work.

Do not commit raw chat exports, credentials, private correspondence, private project URLs, or unrelated personal records. Source imports belong outside this repository's published tree. Ignored private-input and chat-export paths are a precaution, not a content-ingestion mechanism.

## Ownership

No open-source license is granted. Original portfolio code and content: © 2026 Ercan Osman Orhan. External media and typefaces remain subject to their respective owners' terms.
