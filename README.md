# Broken Robot

A local React + TypeScript studio website, featuring Brickhold. Four separately built micro frontends compose into one site: introduction, game showcase, field guide, and studio/contact. The shell owns navigation and layout foundations. No GitHub remote or hosted site is configured yet.

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

- `content/site.json`: studio identity, game status and Kingdoms map cards.
- `content/catalog.json`: complete trap/enemy collections with inline descriptions and costs.
- `apps/intro/src/entry.tsx`: introduction copy.
- `apps/brickhold/src/entry.tsx`: game presentation.
- `apps/studio/src/entry.tsx`: about/contact copy.
- `apps/shell/public/media/`: self-contained, compressed artwork.
- `apps/shell/src/styles.css`: shared colours, typography, navigation.

The game repository and Downloads folder are not needed to run or build this site. [docs/ASSETS.md](docs/ASSETS.md) records the supplied source files, crop bounds and animation details. To regenerate the media, run `node scripts/import-assets.mjs` with the named originals in Downloads, or pass an explicit source directory. The gallery has six actual game views and two opt-in animated clips. The field guide has three keyboard-accessible tabs: The traps, The troublemakers and Kingdoms. Each roster displays its whole collection at once: eight defenses or eleven enemies as non-clickable cards with hover effects and visible descriptions. Kingdoms starts with the actual Playground arena. A separate Shardkeeper preview beneath the collections establishes where the future playable-hero roster will sit. Still images are the default, including for reduced-motion visitors.

## Browser checks

```powershell
npx playwright install chromium
npm run test:e2e
```

Tests start their own production preview on port 4173 and cover loading all four MFEs, complete static collections, keyboard tab navigation, the current kingdom, gameplay switching, mobile navigation, image loading, a failed remote with retry, and deployment below a repository path. Build first. On Windows the configuration uses the installed Microsoft Edge; elsewhere it uses Playwright Chromium. `node services/bff/integration-check.mjs` also checks the live BFF through the Vite proxy and browser (uses Edge on Windows).

## GitHub Pages later

An opt-in manual workflow lives at `.github/workflows/pages.yml`. After creating the GitHub repository and pushing this local repository, select **Settings → Pages → Source → GitHub Actions**, then run **Actions → Deploy website → Run workflow**. It uploads only `dist/site`. Nothing publishes automatically on push in this starter.

The build uses relative URLs and works at a repository subpath or domain root. Your custom domain is configured later in GitHub Pages settings and your domain provider's DNS. No placeholder `CNAME`, remote, domain or external store/social links have been added.

Code and media do not currently have a blanket redistribution licence. Preserve upstream font/media notices and review the game assets' individual rights before public publication. No release date or public game download is claimed.
