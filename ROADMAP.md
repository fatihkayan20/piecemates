# Roadmap

Keep this updated as work lands. Move items to **Done** with the commit that shipped them. New ideas start in `todo.md` and are synced here under the same section titles.

## Urgent or easy fixes Prio 1

## Polish and user engagement features Prio 2

- [ ] **i18n**: translations on web and native.
- [ ] **Big puzzles on small screens**: a 988-piece room opens with pieces about 11px wide on web and 4-5px on iPhone; start zoomed in enough to pick one up.
- [ ] **Bag view frames its pieces**: opening a bag leaves the camera where it was, so a bag's few pieces can be dots in a corner.
- [ ] **Fit the picture on win**: when the puzzle is solved, zoom out so the whole image shows (iOS stays where you were and cuts it off).
- [ ] **iOS pinch zoom**: pinches felt uneven (one barely zoomed, the next jumped) and didn't stay centred on the fingers. Seen in the simulator; check on a device.

## Game features Prio 3

- [ ] **Ambient music**: a few music tracks to pick from, chosen per person and not shared with the room.
- [ ] **Piece rotation option**: room creation gets a rotation choice. The default keeps pieces in the correct rotation; random rotation makes it more challenging (pieces need turning before they snap).
- [ ] **History**: completed and expired rooms with friends' names, duration and date. No image, since images get cleaned up to keep costs down. Built on `room_players` in D1 (this also covers resuming unfinished rooms).
- [ ] **Upload limits**: room creation with uploads is free for now but will be paid later; limit it and make sure anonymous logins can't be used to get around the limit.
  - **Photo upload**: `POST /uploads` returns a direct upload URL for R2. The client resizes to about 2048px first (canvas on web, `expo-image-manipulator` on native). Add the R2 host to `ALLOWED_IMAGE_HOSTS` in `apps/server/src/index.ts`.
- [ ] **Better home screen and room creation**: image lists by category (e.g. today's selection), and room creation in a sheet instead of inline.
  - **Unsplash search**: a server route `GET /images/search` keeps the API key server-side and handles attribution plus the required download-tracking call.
- [ ] **Stale data cleanup**: a background job removes expired rooms and their images.
- [ ] **Project diagram**: one detailed Mermaid diagram of the whole project (packages, apps, data flow, room lifecycle), for planning and for picking the project back up later.

## Later

- [ ] **Universal links and app links**: `https://<web>/room/CODE` opens the app when it's installed. Needs the production web domain, an `apple-app-site-association` (with the Apple Team ID, a paid account) and `assetlinks.json` served from it, plus `associatedDomains` / `intentFilters` in `app.json`. Set `EXPO_PUBLIC_WEB_URL` for production builds.
- [ ] **Room header buttons on Android**: share, players and settings use `unstable_headerRightItems`, which is iOS only; add `headerRight` buttons for Android (TODO in `room-header-items.tsx`).
- [ ] **Replace `with-ios-scene.js`**: try `expo-build-properties` instead of the custom plugin.
- [ ] **Reconnect**: the room socket reconnects on its own after a drop (web and native), instead of showing "disconnected".
- [ ] **Nicknames and player colours**: guests pick a name, and pieces locked by others are tinted in that player's colour instead of only dimmed.
- [ ] **Accounts**: add email and social login in Better Auth. Guest data already moves to the real account through `onLinkAccount`.
- [ ] **Portrait phones**: the table has one shape for everyone, so a landscape puzzle leaves empty space above and below on a portrait phone. Consider laying the pile out to suit portrait screens.
- [ ] **Who is in which bag**: show on each bag chip which players are looking at it (a presence field).
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
- [ ] **First deploy**: `pnpm run deploy`, set `CORS_ORIGIN` to the deployed web origin, then deploy again. Host the web app and server on sibling subdomains (`app.` / `api.`) so the auth cookie works for WebSockets.

## Done

- [x] **PostHog and Sentry**: errors and 10% of traces go to Sentry (web, iOS, Worker and room), one trace from the client into the Worker; PostHog gets production events only, each stamped `app=piecemates` with platform, version and environment, plus `room_created`, `room_joined` and `puzzle_solved`. Settings live in `@piecemates/telemetry`. `4938451` `3e53dc0` `93c4332` `f83b9b8` `cba578b`
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
