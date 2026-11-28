# Broken Robot

A React + TypeScript studio website featuring Brickhold. Four separately built micro frontends compose into one site: introduction, game showcase, field guide, and studio/contact. The shell owns navigation and layout foundations.

The visual identity leads with Brickhold: an actual in-game portal scene and supplied game logo, parchment story panels, collectible field-guide cards, and a studio contact postcard. The original studio logo appears throughout. [Design notes](docs/DESIGN.md) record the direction and implementation choices.

## Run locally

Requires Node 20.19+ (Node 22 LTS recommended).

```powershell
cd C:\Code\broken-robots
npm ci
npm run dev
```

Open http://127.0.0.1:5173. All four sections rebuild automatically as you edit; content changes refresh the page. The first startup compiles the remote bundles before opening the shell.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

The production preview runs at http://127.0.0.1:4173. The complete static site is in `dist/site/`. `npm run build --workspace @broken-robots/field-guide` rebuilds just that micro frontend into `dist/mfe/field-guide`; `npm run build` assembles all current builds for publication.

## Explore the BFF

The website needs no server in its default mode. An optional Node BFF shows how a frontend-specific API connects to shared content:

```powershell
# Terminal one
npm run bff

# Terminal two
$env:VITE_BFF_URL='http://127.0.0.1:8787'
npm run dev
```

The shell proxies `/api` to the local BFF in development. Open browser DevTools → Network and inspect `/api/site` and `/api/catalog`. `GET http://127.0.0.1:8787/api/health` identifies the service. To return to static mode, remove the environment variable (`Remove-Item Env:VITE_BFF_URL`) and restart the dev server. A commented `.env.example` is also provided.

The BFF is a read-only teaching example over local JSON; it does not send email, store signups, or have a database. GitHub Pages cannot run Node APIs. Keep the default static mode for Pages; a production BFF would need a separate server and an explicit API/CORS configuration. Do not build a Pages artifact with `VITE_BFF_URL` set.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries, request flow, contracts, tradeoffs, and how to extend it.

## Edit content and artwork

- `content/site.json`: studio identity, playtest link, game status and Kingdoms map cards.
- `content/catalog.json`: complete trap/enemy/upgrade collections with inline descriptions, trap costs and upgrade rarity.
- `apps/intro/src/entry.tsx`: introduction copy.
- `apps/brickhold/src/entry.tsx`: game presentation.
- `apps/studio/src/entry.tsx`: about/contact copy.
- `apps/shell/public/media/`: self-contained, compressed artwork.
- `apps/shell/src/styles.css`: shared colours, typography, navigation.

The game repository and Downloads folder are not needed to run or build this site. [docs/ASSETS.md](docs/ASSETS.md) records the supplied source files, crop bounds and animation details. To regenerate the upgrade icons, run `node scripts/import-upgrade-cards.mjs path/to/upgrade-cards.png`, then run it again with `path/to/upgrade-cards-extra.png`. For the remaining media, run `node scripts/import-assets.mjs` with the named originals in Downloads, or pass an explicit source directory. The gallery has six actual game views. Defend has an opt-in gameplay video that starts paused and supports pausing and resuming in place. The field guide has four keyboard-accessible tabs: The traps, The troublemakers, Upgrade Cards and Kingdoms. Each roster displays its whole collection at once: eight defenses, eleven enemies or twenty-five between-wave upgrades as non-clickable cards with hover effects and visible descriptions. Kingdoms features the supplied Playground and WindWhistle Mill map artwork. A separate Shardkeeper preview beneath the collections establishes where the future playable-hero roster will sit. The showcase cycles through The world, Build, Funnel, Defend, Fight and Guardians every 15 seconds, starting on The world and looping through all six views. A manual selection restarts the timer. Gameplay video still only plays on request, including for reduced-motion visitors, and pauses when the view changes.

## Browser checks

```powershell
npx playwright install chromium
npm run test:e2e
```

Tests start their own production preview on port 4173 and cover loading all four MFEs, complete static collections, keyboard tab navigation, both kingdoms, gameplay switching, mobile navigation, image loading, a failed remote with retry, and deployment below a repository path. Build first. On Windows the configuration uses the installed Microsoft Edge; elsewhere it uses Playwright Chromium. `node services/bff/integration-check.mjs` also checks the live BFF through the Vite proxy and browser (uses Edge on Windows).

## Loading and caching

Production builds include the section manifest and static content in the HTML, so rendering does not wait for separate manifest or JSON requests. Styles, section modules, the opening artwork and fonts are discovered early through preload hints. The gameplay video downloads only when played.

Media and section bundles use content fingerprints under `cache/<hash>/`; fonts and shell bundles use Vite's hashed filenames. Unchanged files retain the same URLs, while changed files get new ones. Development keeps live content requests, and optional BFF mode still fetches its API.

Upload the complete `dist/site` artifact as one deployment. On a configurable host, use `Cache-Control: no-cache` for HTML and `public, max-age=31536000, immutable` for `/cache/` and hashed `/assets/` files. GitHub Pages controls its own response headers; the build does not override them. Keep prior hashed assets available during deployment if the host supports it, so previously opened pages can finish loading. Fingerprinting follows [Vite's asset caching approach](https://vite.dev/guide/assets). There is no service worker or offline cache, and first-time visitors still need to download the assets.

The browser tests verify embedded content, cache reuse with the local test server's cache headers, manual retry, and repository-subpath URLs. To check Chrome on Windows, run `$env:TEST_BROWSER='chrome'` followed by `npm run test:e2e`; remove that variable to return to Edge.

## GitHub Pages later

An opt-in manual workflow lives at `.github/workflows/pages.yml`. In the GitHub repository, select **Settings → Pages → Source → GitHub Actions**, then run **Actions → Deploy website → Run workflow**. It uploads only `dist/site`. Nothing publishes automatically on push.

The build works at a repository subpath or domain root. The Pages workflow reads the configured public URL and uses it for the canonical URL, social preview image and `sitemap.xml`. For another host, set `SITE_URL` to the final public URL, including any site subpath, before running `npm run build`. Local builds omit host-dependent URLs. On a subpath host, submit the generated sitemap URL directly in Search Console because crawlers read `robots.txt` at the domain root.

Code and media do not currently have a blanket redistribution licence. Preserve upstream font/media notices and review the game assets' individual rights before public publication. The hero links to the Brickhold playtest on itch.io.
