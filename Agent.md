# Agent Guide

## Project Context

This repository is a competition demo for an AI-powered Chinese traditional culture interactive map. The current implementation focuses on regional Chinese food culture and supports a national overview, food-culture regions, province-level drill-down interactions, AI image assets, quizzes, and a development mode for content/configuration work.

Primary stack:

- React 18 + Vite
- Anime.js for all web animation behavior
- Zustand with localStorage persistence
- XState for view/mode state
- React Simple Maps + d3-geo for map rendering
- Hono Node server as a local MCP/API bridge
- Python helper scripts for food image clipping and contour sheet generation

## Product Requirements Baseline

This section is the source of truth for near-term implementation. When changing the project, keep the work aligned with these requirements before adding secondary features.

### Product Goal

Build a polished, interactive Chinese food culture map. The map itself is the primary experience: users should be able to move the pointer across map regions, see immediate visual feedback, click into regions/provinces, return between levels, and inspect related food images and cultural content without the interface feeling static.

The key technical feature is a contour-driven AI image workflow for map blocks:

1. Take a local map block contour image as the shape input.
2. Generate an AI image for that block with the local `imagegen` skill or the existing local image-generation bridge.
3. The generated source image may be a square or rectangle.
4. The workflow must allow control over generated image width and height.
5. Precisely clip the generated source image by the contour mask.
6. Use the clipped image as the visual fill for the corresponding map block.
7. Render that clipped image inside the interactive map without breaking pointer hover/click behavior.

### Priority Order

1. **Map interaction first.** Hover, click, focus, drill-down, back navigation, selected state, tooltip/status feedback, and keyboard-friendly button behavior are more important than decorative panels.
2. **Contour image workflow second.** The app must clearly support input contour -> AI source image -> contour clipping -> map block display. This should work for at least one block end-to-end before expanding to all blocks.
3. **Visual smoothness third.** Add refined transitions and animations only after the map and clipping workflow work reliably.
4. **Content depth fourth.** Quizzes, stories, prompts, and extra data should enhance the map, but must not interfere with the core interaction or image workflow.

### Interaction Requirements

- The first screen must be the usable interactive map, not a landing page.
- The right-side panel should provide two clear modes:
  - **Browse mode:** the normal real user-facing experience, focused on map exploration, cultural content, item details, process/story viewing, and quizzes.
  - **Development mode:** a configuration workspace for adjusting as many map-customizable properties as practical, including region metadata, colors, labels, active layers, AI fill assets, item thumbnails, item positions, spotlight positions, prompts, image sizes, and contour/clipping assets.
- Map regions must respond to pointer hover with visible highlight, cursor affordance, and status text.
- Clicking a country/area/province block should select it and update the right-side or contextual detail panel.
- Common navigation must be available: return to national view, return to area view, reset current selection.
- Food thumbnails should be clickable and should open or update a detail/process view.
- Image fill layers must not block map pointer events. SVG/image overlays should use pointer-event passthrough where needed.
- The UI should work at desktop and smaller widths without text overlap or controls escaping their containers.

### AI Map Block Image Requirements

- Each map block asset should have:
  - an input contour image path,
  - a generated source image path,
  - a clipped output image path,
  - prompt metadata,
  - width and height controls for generation/source sizing,
  - a cache-bust/update mechanism so regenerated images appear in the map immediately.
- The generated source image is not the final map display. The clipped output is the map display asset.
- Clipping must use the contour shape as the authoritative alpha mask.
- Generated artwork should fill the whole contour interior, avoid large empty areas, and avoid readable text, watermarks, people, UI, or logos.
- If only one sample is being tested, prefer the national China block first, then expand to area/province blocks.
- Do not stretch a clipped output in a way that makes it visibly detach from the underlying geographic contour. The image frame must align with the same contour coordinate system used for rendering.

### Asset Safety Rules

- Do not delete existing food thumbnail images.
- Do not delete existing province food images unless the user explicitly asks for that asset replacement.
- Do not bulk-regenerate all assets unless the user explicitly asks for a batch operation.
- It is acceptable to regenerate or replace a single selected map-block source/output pair when testing the workflow.
- Keep generated project assets under `public/assets/food/` or its existing generated subfolders. Do not leave app-referenced assets only under `$CODEX_HOME/generated_images`.

### Visual Requirements

- The map should feel alive: smooth region hover, image reveal, drill-down transitions, selected-state emphasis, and thumbnail motion are expected.
- All animations should feel as smooth and fluid as possible. Prefer natural easing, short responsive durations, and GPU-friendly `transform` / `opacity` transitions over layout-shifting motion.
- All current and future web animation effects must be implemented through Anime.js (`animejs`). Do not add CSS `transition`, CSS `animation`, or `@keyframes` for app motion; keep CSS to static visual states and route motion through the shared Anime.js helpers.
- Animations must support usability. Avoid effects that obscure map boundaries, delay clicks, or make hit targets unstable.
- Respect reduced-motion preferences with simpler fades or no nonessential movement when appropriate.
- The map fill image should remain inspectable. Avoid dark, blurred, or overly decorative treatment that hides the generated food artwork.
- Layout should be application-like and operational, not a marketing hero page.

### Development Mode Requirements

- Development mode must be separate from browse mode so configuration controls do not clutter or weaken the real user-facing interaction.
- Browse mode should remain the default polished experience. Development mode can expose dense controls, but it should still be organized, smooth, and safe to use.
- Development tools should make the contour workflow obvious:
  - select target block,
  - inspect contour and current output,
  - edit prompt,
  - control source image width/height,
  - run generation/clipping,
  - see the map update.
- If API generation is unavailable because environment variables are missing, the UI should fail clearly and keep prompt editing/asset inspection usable.
- Existing endpoints should remain stable unless there is a clear reason to change them:
  - `GET /api/assets`
  - `PATCH /api/assets/:assetId`
  - `POST /api/assets/:assetId/regenerate`
  - `GET /api/mcp/tools`
  - `POST /api/mcp/run`

### Acceptance Checklist

Before considering a change complete:

- The app builds with `npm run build`.
- `npm run dev` starts the local app and bridge.
- The national map renders with a visible clipped AI image fill.
- Hovering and clicking map regions still works when the clipped image layer is present.
- At least one contour-driven image can be shown in the map block end-to-end.
- Food thumbnails are still present and clickable.
- No unrelated generated assets were deleted.
- The browser view has no obvious overlap between map, controls, labels, and thumbnails.

## Run Commands

Install dependencies:

```bash
npm install
```

Run the full local app:

```bash
npm run dev
```

This starts both:

- MCP/API bridge: `node server/mcp-bridge.mjs`
- Vite frontend: `http://0.0.0.0:3000/`

After every project update, restart the running project on `0.0.0.0:3000` and report the external access URL to the user. Use `http://103.163.46.225:3000/` as the standard access address unless the user provides a newer host.

The deployed frontend is served by nginx from `/www/wwwroot/china-map-explorer/dist` on port `3000`. After syncing a fresh `dist/` build to that directory, run:

```bash
chmod -R a+rX /www/wwwroot/china-map-explorer/dist
nginx -s reload
```

This keeps nginx from returning `403 Forbidden` because of restrictive build-output permissions.

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

There is currently no dedicated test script. Use `npm run build` as the minimum validation after code changes.

## Important Files

- `src/App.jsx`: Main interactive map application, state machine usage, UI, data fetching, map rendering, development mode interactions.
- `src/animeMotion.js`: Shared Anime.js motion layer for hover, map fill, loading, food hotspot, panel, and spinner animations.
- `src/foodMapConfig.js`: Default food culture theme, area/province mappings, image assets, quizzes, helper config functions.
- `src/useFoodMapStore.js`: Zustand store with persisted theme state.
- `src/styles.css`: Global app styles and visual themes.
- `server/mcp-bridge.mjs`: Local Hono API/MCP bridge used by frontend development tools.
- `server/image-assets.mjs`: Image asset metadata, prompt generation, image regeneration API integration.
- `server/data/food-map-config.json`: Saved/exported food map config.
- `server/data/food-image-assets.json`: Saved image prompt/asset metadata.
- `public/geo/china.json`: China province GeoJSON.
- `public/assets/food/`: AI food images, contour assets, generated source images, and derived assets.
- `scripts/`: Python utilities for clipping and contour asset preparation.
- `PRD.md`: Product requirements and intended direction.

## Architecture Notes

The app is config-driven. Prefer extending `DEFAULT_FOOD_THEME` and related helper functions in `src/foodMapConfig.js` instead of hard-coding new cultural content in components.

Theme data flows through:

1. `src/foodMapConfig.js` defines the default theme and assets.
2. `src/useFoodMapStore.js` clones and persists the theme under `agy-food-culture-map-v3`.
3. `src/App.jsx` renders the map, UI panels, quizzes, image tools, and mode-specific controls.
4. `server/mcp-bridge.mjs` exposes local API endpoints for MCP tools and saved config.
5. `server/image-assets.mjs` merges default image assets with saved prompt metadata.

When updating area/province content, keep these fields consistent:

- `area.id`
- `area.provinceAdcodes`
- `area.center`
- `area.summaryAsset`
- `area.assets[].provinceAdcode`
- image paths under `public/assets/food/`
- quiz content and `answerIndex`

## Coding Guidelines

- Match the existing ES module style and React function-component patterns.
- Keep project-facing text in Chinese unless the surrounding file is already English-only.
- Prefer configuration changes over component branching when adding cultural regions, assets, quizzes, or copy.
- Keep map behavior responsive; avoid fixed dimensions that break smaller viewports.
- Do not rename existing area IDs, storage keys, asset IDs, or public asset paths unless all references and persisted-data implications are handled.
- Do not delete or regenerate image assets unless the task explicitly asks for asset work.
- Keep comments short and useful. Existing files already use concise Chinese comments for domain-specific logic.
- Avoid broad refactors in `src/App.jsx`; it is large and user-facing, so keep changes scoped.
- Once a complete feature has been successfully implemented and verified, commit and push the completed work. Include only files relevant to that feature, and do not commit unrelated local or user changes.

## API And Asset Notes

The bridge exposes:

- `GET /api/mcp/tools`
- `POST /api/mcp/run`
- `GET /api/assets`
- `PATCH /api/assets/:assetId`
- `POST /api/assets/:assetId/regenerate`

Image regeneration requires `OPENAI_API_KEY`. Optional environment variables:

- `OPENAI_BASE_URL` or `OPENAI_API_BASE`
- `IMAGE_GEN_MODEL`
- `IMAGE_GEN_QUALITY`
- `IMAGE_GEN_SIZE`
- `MCP_BRIDGE_PORT`

If `OPENAI_API_KEY` is not set, prompt editing and normal app development can still proceed, but actual image regeneration will fail.

## Validation Checklist

After frontend or config changes:

```bash
npm run build
```

For visual or interaction changes, also run:

```bash
npm run dev
```

After restarting, give the user the access address `http://103.163.46.225:3000/`, then open `http://0.0.0.0:3000/` locally and check:

- National map renders without blank regions.
- Region click/drill-down still works.
- Back navigation returns to the national overview.
- Theme switching does not break layout.
- Development mode tools still load `/api/mcp/tools` and `/api/assets`.
- Text does not overlap on narrow screens.

For asset regeneration changes, verify that generated files and metadata still align with the expected paths in `public/assets/food/` and `server/data/food-image-assets.json`.

## Common Pitfalls

- Zustand persistence can preserve old theme data in localStorage. If a config change appears missing in the browser, clear the `agy-food-culture-map-v3` localStorage key or use the app reset flow.
- The frontend dev server uses Vite with `--strictPort` on host `0.0.0.0` and port `3000`; a port conflict will stop startup instead of selecting another port. Do not switch to another frontend port unless the user explicitly changes the deployment rule.
- Do not assume `server/data/*.json` is the single source of truth. Defaults are rebuilt from `src/foodMapConfig.js` and then merged with saved data.
- Province adcodes are strings. Keep them quoted to avoid accidental numeric conversion.
- Public asset paths should be root-relative, for example `/assets/food/510000-food-ai.png`.
