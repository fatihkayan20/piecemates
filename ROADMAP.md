# Roadmap

Keep this updated as work lands. Move items to **Done** with the commit that shipped them. New ideas start in `todo.md` and are synced here under the same section titles.

## Urgent or easy fixes Prio 1

## Polish and user engagement features Prio 2

## Game features Prio 3

- [ ] **Upload limits**: room creation with uploads is free for now but will be paid later; limit it and make sure anonymous logins can't be used to get around the limit.
  - **Photo upload**: `POST /uploads` returns a direct upload URL for R2. The client resizes to about 2048px first (canvas on web, `expo-image-manipulator` on native). Add the R2 host to `ALLOWED_IMAGE_HOSTS` in `apps/server/src/index.ts`.
- [ ] **Better home screen and room creation**: image lists by category (e.g. today's selection).
  - **Unsplash search**: a server route `GET /images/search` keeps the API key server-side and handles attribution plus the required download-tracking call.
- [ ] **Stale data cleanup**: a background job removes expired rooms and their images. Keep the D1 `rooms` and `room_players` rows (History reads them); delete the Durable Object's storage and the image, and mark the room expired.
- [ ] **Store review prompt**: ask for an App Store / Play Store review at a good moment.

## Later

- [ ] **Universal links and app links**: `https://<web>/room/CODE` opens the app when it's installed. Needs the production web domain, an `apple-app-site-association` (with the Apple Team ID, a paid account) and `assetlinks.json` served from it, plus `associatedDomains` / `intentFilters` in `app.json`. Set `EXPO_PUBLIC_WEB_URL` for production builds.
- [ ] **Room header buttons on Android**: share, players and settings use `unstable_headerRightItems`, which is iOS only; add `headerRight` buttons for Android (TODO in `room-header-items.tsx`).
- [ ] **Replace `with-ios-scene.js`**: try `expo-build-properties` instead of the custom plugin.
- [ ] **Reconnect**: the room socket reconnects on its own after a drop (web and native), instead of showing "disconnected".
- [ ] **Nicknames and player colours**: guests pick a name, and pieces locked by others are tinted in that player's colour instead of only dimmed.
- [ ] **Accounts**: add email and social login in Better Auth. Guest data already moves to the real account through `onLinkAccount`.
- [ ] **Portrait phones**: the table has one shape for everyone, so a landscape puzzle leaves empty space above and below on a portrait phone. Consider laying the pile out to suit portrait screens.
- [ ] **Who is in which bag**: show on each bag chip which players are looking at it (a presence field).
- [ ] **Count every room leave**: `room_left` fires when someone leaves inside the app (Home, Back), not when they close the tab or kill the app; send it on `pagehide` (with PostHog's beacon transport) and when the app goes to the background if that gap matters.
- [ ] **Trace game moves**: a Sentry trace reaches the Worker over HTTP, but room socket messages carry no trace headers; send the trace with each move and start a span per message in the room if moves need tracing. Native also has no screen-change spans yet (`reactNavigationIntegration` with Expo Router's navigation ref).
- [ ] **Performance at 1000 pieces**:
  - Native gestures run on the JS thread; move them to worklets if dragging stutters.
  - Skia re-records all 988 pieces on the JS thread for every change (about 200ms in dev). Normal play is fine, but a sustained burst of about 11 placed pieces a second still backs iOS up.
  - Consider Skia `Atlas` instead of one clip group per piece.
  - Room state is saved as one Durable Object key (about 60 KB); split it if it grows.
- [ ] **Piece shape variety**: all tabs currently share one shape; add per-edge random jitter from the seed.
- [ ] **Touch pinch-zoom on web**: web currently zooms only with the mouse wheel.
- [ ] **Android**: dev build and a device test pass.
- [ ] **Expo SDK 58**: upgrade, then delete `apps/native/plugins/with-ios-scene.js`.
- [ ] **Cloudflare overview**: usage, limits and monitoring for Workers, Durable Objects, D1 and R2 on the free plan.
- [ ] **AI playtest once more**: play one large puzzle the way a person would, to find issues and improvements. An orchestrator starts two sub-agents, one driving iOS and one driving web, each with its own focus (e.g. bagging edge pieces vs. building the middle). They only get the app and what it does, and report back as users.

- [ ] **Delete account**: players can delete their account in the app (App Store requirement), with their sessions and room memberships.
- [ ] **Privacy policy and terms links**: Settings links to the privacy policy and terms of service.

- [ ] **Real music tracks**: the three ambient loops are generated placeholders (a small synth script, ~390 KB AAC each); swap in licensed tracks under the same ids (`calm`, `drift`, `night`) in `apps/*/assets/music`.
- [ ] **Room saves on every move**: the room writes its whole state (about 60 KB at 1000 pieces) to Durable Object storage on every accepted message, locks included. Fine for now; if writes or CPU show up in the Cloudflare dashboard, save per piece or batch saves (locks must survive hibernation, so they can't simply be skipped).

- [ ] **Before deploying Sentry and PostHog**:
  - Server: set `SENTRY_DSN` where `alchemy deploy` runs (it's read into the Worker's bindings).
  - Web: `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST=https://eu.i.posthog.com` and `SENTRY_AUTH_TOKEN` (uploads source maps on build) in the web build env.
  - Native: `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` and `SENTRY_AUTH_TOKEN` (EAS secret) for release builds.
  - Make a new Sentry auth token; the current one was pasted in a chat.
  - In PostHog, filter dashboards on `app = piecemates`; the project is shared with another app.
  - Traces are kept at 100% (`TRACES_SAMPLE_RATE` in `@piecemates/telemetry`); lower it when traffic grows.
- [ ] **First deploy**: `pnpm run deploy`, set `CORS_ORIGIN` to the deployed web origin, then deploy again. Host the web app and server on sibling subdomains (`app.` / `api.`) so the auth cookie works for WebSockets.

## Done

- [x] **Data fetching library**: the room API is a tRPC router (`packages/api`) and both apps read it through one shared TanStack Query cache. Lists refetch after mutations and after opening a room, not on every focus. `8ca15be`
- [x] **Abandoned puzzles in History**: History lists rooms I abandoned ("Abandoned after 1:07") next to solved ones. Reopening one counts against the open-room cap. `0163109`
- [x] **Music picker sheet**: the Settings tab's Music row opens a sheet where the chosen track plays while it's open. The room keeps the inline segments, where music already plays. `1455448`
- [x] **Abandon confirmation**: Abandon turns the room's settings sheet into its confirmation in place (flag, title, Abandon / Keep playing), so the sheet keeps its height on web and iOS. `d0775eb`
- [x] **Native bars in the app theme**: a navigation theme follows the app's light/dark mode, so collapsed headers, the tab bar and the status bar aren't light in dark mode. The tab bar uses the app colours, and Settings gets a large title. `c518d78` `bb56025`
- [x] **iOS sheets in the app theme**: SwiftUI sheets use the app's (or the board's) light/dark scheme and background, with monochrome buttons like the rest of the app; toggles stay green. `34f1309`

- [x] **Native tab bar**: the iOS drawer is replaced by native tabs (Home, History, Settings; the room opens over them, without the bar). Settings holds the view settings and dark mode. `Container` now pads the scroll content, so the tab screens' gaps and the large titles show. `799ac1d`
- [x] **Continue, open-room limit and Abandon**: Home lists my unsolved rooms; History lists only solved ones (abandoned rooms show in neither). A player may have 3 open rooms (`MAX_OPEN_ROOMS`); Abandon in the room settings (confirmed: inline on web, the native dialog on iOS) frees one, and opening the room again brings it back. `4da2da8` `b195415` `9ce21f5` `41ef88d` `f9e72fd`
- [x] **Clearer room creation**: every piece count is a visible button on iOS too, and "Rotated pieces" explains itself ("Harder: pieces start facing random ways…"). `b195415` `41ef88d`
- [x] **`pnpm dev` after deleting `.alchemy`**: the dev script runs `alchemy dev --force`, so a fresh local database gets its migrations. `32af3f2`

- [x] **Ambient music**: Off / Calm / Drift / Night in the room settings, per device, looping at 40% volume under the cues; web starts on the next press when autoplay is blocked. `5379e08` `fb401c0` `2b2064a`
- [x] **Piece rotation option**: room creation moved into a sheet (piece count + "Turned pieces"); in a rotation room pieces start turned and a tap/click turns a group a quarter turn around the tapped piece; only same-way-up neighbours join, and a piece is placed (and the puzzle done) only upright. Older rooms load unturned. `aa78532` `09ee05e` `75c458b` `47eb278` `468d354`
- [x] **History**: `GET /rooms` lists the rooms I've played in (newest 50) with the other players' names, play time and date; a History page on web and a History screen on iOS, where a row resumes or reopens its room. `eaf1f29` `f13d3ea` `480882b` `f761adb`
- [x] **Project diagram**: `ARCHITECTURE.md` with a Mermaid map of apps, packages and Cloudflare, and a room's life as a sequence diagram. `148f3f1`
- [x] **Better Auth built once per isolate** instead of on every request. `3993615`

- [x] **i18n**: i18next on web and native, English only. Text lives in a typed `locales/en.ts` in `@piecemates/client`, so a wrong key or a missing `{{value}}` fails the type check; the device language is picked at startup (browser languages, `expo-localization`). Add a language as `locales/<code>.ts` next to it. `ad05011` `9dd07b4` `fbf23d0`
- [x] **Camera follows the room**: a big room starts zoomed in on the top of the pile so a piece can be picked up (40px); opening a bag frames its pieces and going back returns to where I was; the win zooms out to the whole picture (also when opening a solved room). `1f85f21` `b464284` `d1f26eb`
- [x] **iOS pinch zoom**: a pinch is measured from where it began and pans with the fingers, so it zooms evenly and stays under them (checked in the simulator; worth a try on a device). `d1f26eb`
- [x] **A bag piece dropped exactly on its spot leaves the bag**: it was fixed in place inside the bag, so the puzzle could never be finished. `95b7268`
- [x] **PostHog and Sentry**: every error and every trace go to Sentry (web, iOS, Worker and room), with one trace from the client into the Worker; 10% of errors come with a screen recording; API answers the user caused (4xx, e.g. a wrong room code) aren't reported. PostHog gets production events only, stamped `app=piecemates` with platform, version and environment, room codes hidden in URLs, players identified by user id: iOS screen views, `room_created`, `room_joined`, `puzzle_solved` (seconds, players), `room_left` (% placed), `room_shared`, `bag_created`. Settings live in `@piecemates/telemetry`. `4938451` `3e53dc0` `93c4332` `f83b9b8` `cba578b` `f25ade1` `2250ab2` `fe34566` `4e699f5`
- [x] **AI playtest**: a 988-piece room solved across web and iOS. It found that iOS froze while pieces moved fast (every move re-rendered all pieces); now only moved pieces re-render. Other findings are listed above. `7c1d08f` `6dbc3e3`
- [x] **Harder to guess room codes**: 8 characters from the 31-letter alphabet, without modulo bias. `3c4846c`
- [x] **Dark and light theme**: board controls take the theme that reads on the picked table colour, whatever the app theme; the native theme choice is saved. `af6108c` `a75f1a0` `d286040` `d21e2a9` `e0a6c0b` `b52f3b2`
- [x] **Screen resize**: the web board shrinks with the window, and a resize keeps the zoom and centre point on web and iOS, debounced so the camera moves once a resize stops. `c632307` `f2037aa` `100ee90` `1471208` `f6d1240` `b04c7c8`
- [x] **Room timings and win celebration**: a server clock that only runs while someone is in the room, a play time chip, `played_ms`/`finished_at` in D1 for History, and confetti with "Solved in m:ss" replacing the controls. `cb520f4` `7543f42` `f0a19cc` `d8106b4` `e64a903` `5b58d6d` `78e448a` `a54d0ac` `a8282e3`

- [x] Monorepo scaffold (Better-T-Stack: TanStack Router, Expo, Hono on Workers, D1, Better Auth). `a589b30`
- [x] Shared game rules in `packages/game`: shapes from a seed, grid options, lock/drop/snap/bag/tidy, message checks. `8d78c3b`
- [x] D1 tables `rooms` and `room_players`. `91866ef`
- [x] Anonymous guest sign-in; a guest's rooms move to their real account when they link one. `47789a0`
- [x] Room Durable Object with WebSockets, max 4 players, state saved per room. `9da65f9`
- [x] Web board (PixiJS): drag, lock, drop, snap, pan, wheel zoom, tidy. `2092713`
- [x] iOS dev build and native board (Skia), in sync with web. `cab20bb`, `4a98d6d`
- [x] Shared `@piecemates/client` package (API, session, room connection, camera) and clearer names across game, web and native. `13cfea8`…`90e4917`
- [x] Table with the pile around the board, drops kept on the table, zoom and pan limits, local-only tidy. `221299e`…`f28ef01`
- [x] Bags: a shared bag bar on web and iOS, drop a piece or group on a bag, a per-device bag view (the bag plus the puzzle so far), groups kept inside bags, take-out zone, create/edit sheet (shadcn on web, Expo UI on iOS). `00f3463`…`5d391c1`
- [x] Sticky edges: a frame piece dropped near its spot on the board sticks there with its group; a bag piece that sticks leaves its bag. `d575c83`
- [x] Placed pieces are fixed: a group in its correct spot can't be picked up or bagged; grabbing it pans the camera. `6935266`
- [x] Reference image: an Image button opens the full picture in a popup (shadcn dialog on web, fading modal on native). `d93ac75` `88fd227`
- [x] Repo rules in `AGENTS.md`, enforced by biome and grit plugins; boards, bag bars and game rules split into small modules around a shared zustand room store. `fe11e50`..`673bbcc`
- [x] Sticky "+ Bag" button: pinned outside the scrolling chip row. `db8c605` `81573cd`
- [x] Share and deep links: the room code shares/copies the web link; `puzzle://room/CODE` opens the room in the app. `31bf93b`..`488664d`
- [x] Room settings: a gear (web header, iOS nav bar) opens a sheet with the table background, saved per device (localStorage / SecureStore). Web room layout now mirrors native: header, bags, table, controls. `913a7a3` `1efec85` `2494bb9`
- [x] Room chrome: share, players (sheet with the player list and connection state) and settings as icons, in the iOS header and beside the web bag row; no room code, player count or "Solved" badges. Also fixes the native bottom bar overflow. `95d32f7` `673c082`
- [x] Sounds and haptics: a snap cue when my drop joins pieces or places them on the board, a win cue when the puzzle is done; plain drops stay quiet. Sounds and Haptics toggles in the settings sheet. Sounds load once, when a room opens. `aff77cc` `b9e45d0` `971617c`
