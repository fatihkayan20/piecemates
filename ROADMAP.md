# Roadmap

Keep this updated as work lands. Move items to **Done** with the commit that shipped them. New ideas start in `todo.md` and are synced here under the same section titles.

## Urgent or easy fixes Prio 1

- [ ] **Unsplash terms: close these gaps before launch** (checked against the [API Terms](https://unsplash.com/api-terms), [API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines) and [License](https://unsplash.com/license) on 2026-09-27; not legal advice). Breaking §6 is a "material breach", and any breach ends our API rights without notice (§19).
  - **Credit wherever a sample shows (§9, §4).** §9 says "each time" an image is displayed it must credit Unsplash and the photographer, with a link to the photographer's profile. Today only the new room sheet does. Missing on: Home's featured and category tiles (the name is only in the accessibility label), the Continue and History rows, and inside the room (board and reference image). §4 also forbids mixing Unsplash photos with other content so users can't tell they're from Unsplash, and Home mixes them with uploads. Fix: a small "name" line on tiles, and store the sample id on `rooms` so rows and the room can show "Photo by … on Unsplash".
  - **A published privacy policy (§5)**: required for every app using the API (and by the App Store anyway). It must say what we collect, store and delete, and what we share with third parties (Unsplash gets image views through the hotlinked URLs and downloads through our calls).
  - **"Non-automated" use**: the guidelines say the API is for "non-automated, high-quality, and authentic experiences", and §12 lets Unsplash add rules for automated use. Our daily Cron sync is automated (at most 30 calls a run). Say so plainly in the production application (curated catalogue, daily sync, hotlinked, downloads tracked) and get their OK in writing.
  - **Stopping means stopping (§19)**: if Unsplash ends our access, we must stop using the API at once, but §6 (hotlinking and download tracking) keeps applying forever. So "turn the sync off and keep the photos" only works while we keep hotlinking and sending download events; if access ends, hide the Unsplash samples. Never copy them to R2: §6 requires the hotlinked URLs, and the Unsplash License forbids compiling its photos into a similar or competing service.
  - **Keep it a puzzle app**: the guidelines forbid selling unaltered photos and replicating Unsplash's core experience (unofficial clients, wallpaper apps). Don't add photo search, downloading or saving the original, or a wallpaper feature.
- [ ] **Apply for Unsplash's production API key**: the demo key allows 50 calls an hour, and each room started from a sample is one of them. Apply once the gaps above are closed and the app is public: screenshots of the credit and a description of the download tracking. Use `utm_source` matching the app name registered there (we send `piecemates`). More at partnerships@unsplash.com if 1000 an hour isn't enough.

## Polish and user engagement features Prio 2

## Game features Prio 3

- [ ] **Store review prompt**: ask for an App Store / Play Store review at a good moment.
- [ ] **Kick a player**: the room owner can remove someone from the room. An edge case; cover it much later.

## Later

- [ ] **Universal links and app links**: `https://<web>/room/CODE` opens the app when it's installed. Needs the production web domain, an `apple-app-site-association` (with the Apple Team ID, a paid account) and `assetlinks.json` served from it, plus `associatedDomains` / `intentFilters` in `app.json`. Set `EXPO_PUBLIC_WEB_URL` for production builds.
- [ ] **Room header buttons on Android**: share, players and settings use `unstable_headerRightItems`, which is iOS only; add `headerRight` buttons for Android (TODO in `room-header-items.tsx`).
- [ ] **Replace `with-ios-scene.js`**: try `expo-build-properties` instead of the custom plugin.
- [ ] **Player colours**: pieces locked by others are tinted in that player's colour instead of only dimmed.
- [ ] **Name prompt on Android**: `askName` uses `Alert.prompt`, which is iOS only; Android needs its own input.
- [ ] **More samples per category**: `samples.list` already pages by 30; Home shows only the first page. Add "Show more" once categories grow past it.
- [ ] **Photo uploads, later steps**:
  - Resize on the client before uploading if upload times hurt (the 20 MB cap and iOS's JPEG re-encode keep it reasonable for now).
  - The first request for a new width is resized on the spot and takes a few seconds; make the common widths right after upload if it shows.
  - `caches.default` in front of `/images` once we're on a custom domain (it does nothing on workers.dev).
  - Uploads are free with daily credits; charge for them later.
- [ ] **Accounts**: add email and social login in Better Auth. Guest data already moves to the real account through `onLinkAccount`.
- [ ] **Who is in which bag**: show on each bag chip which players are looking at it (a presence field).
- [ ] **Count every room leave**: `room_left` fires when someone leaves inside the app (Home, Back), not when they close the tab or kill the app; send it on `pagehide` (with PostHog's beacon transport) and when the app goes to the background if that gap matters.
- [ ] **Trace game moves**: a Sentry trace reaches the Worker over HTTP, but room socket messages carry no trace headers; send the trace with each move and start a span per message in the room if moves need tracing. Native also has no screen-change spans yet (`reactNavigationIntegration` with Expo Router's navigation ref).
- [ ] **Performance at 1000 pieces**:
  - Native gestures run on the JS thread; move them to worklets if dragging stutters.
  - Skia re-records all 988 pieces on the JS thread for every change (about 200ms in dev). Normal play is fine, but a sustained burst of about 11 placed pieces a second still backs iOS up.
  - Consider Skia `Atlas` instead of one clip group per piece.
  - Room state is saved as one Durable Object key (about 60 KB); split it if it grows.
- [ ] **Piece shape variety**: all tabs currently share one shape; add per-edge random jitter from the seed.
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
- [ ] **Abuse test in production**: right after the first deploy, run the abuse sub-agent against the deployed apps. Locally every request comes from 127.0.0.1 and a client can set `cf-connecting-ip` itself; in production Cloudflare sets it, so check the guest sign-in limit, the upload IP cap (IPv6 /64 too), the per-user write limit, signed photo links and the daily cleanup Cron Trigger there.

## Done

- [x] **Placement and start zoom (checked against Jigsaw Explorer on a phone and a desktop)**: a new room's pile grows towards the shape of the screen it was made on (`aspect`), so a portrait phone gets the pile above and below the board, and it packs tighter (1.25-cell slots, less free space); older rooms keep their layout. Rooms start on the whole table unless a piece's longer side would be under 24px. `a7967f8` `3c49190`
- [x] **Edge padding**: the camera keeps 32px between the table and the screen edge, so edge pieces are easy to reach. `3c49190`
- [x] **No page selection on the board**: a long press no longer turns the screen blue or opens the iOS callout, and iOS no longer zooms into small inputs. `ae492e7`
- [x] **Pieces stop following the finger until a reload**: two causes. Pixi never passes on `pointercancel`, so a touch iOS took for itself left a stale drag; the board now handles cancel, blur and backgrounding itself. And the room socket never reconnected after a phone put the page in the background; it now reopens on its own (web and native). `ae492e7` `e6eda89`
- [x] **Custom domain**: the web is on `piecemates.fatihkayan.dev` (DNS on Cloudflare), and `www.piecemates.fatihkayan.dev` 301s to it. The server stays on workers.dev for the iOS app and image links. `7f65696`
- [x] **First deploy**: `pnpm -F @piecemates/infra deploy` puts the `production` stage on workers.dev, with its settings in the git-ignored `packages/infra/.env.deploy.local`. The web Worker forwards `/api`, `/trpc` and `/rooms` to the server, so the session cookie is first-party without a custom domain (Safari drops cross-site ones). `2c906b7` `830091c`
- [x] **Touch pinch-zoom on web**: two fingers on empty table zoom and pan with the same `pinchCamera` as iOS (checked in iPhone Safari). `516ef9b`
- [x] **Stale data cleanup**: the daily Cron Trigger clears rooms that are solved, abandoned by every player, or not played for 30 days (even unsolved). Their Durable Object storage and uploaded original go; the D1 rows stay, marked expired, and the small resized copies stay for History thumbnails. A cleared room moves from Continue to History ("Cleared after …"), its row no longer opens, and opening it by code says it was cleared. At most 200 rooms a run. `dd8f59d` `e32a19b` `f8e2a0b`

- [x] **Sample catalogue from Unsplash (better Home and room creation)**: a daily Cron sync fills a D1 catalogue to 200 photos, then adds 5 per category a day, marking a few featured. Home shows a featured row, category chips (Nature, Cities, Animals, Food, Art, Space) and the grid with the upload tile, on web and iOS. Rooms start from a sample id, so clients never send image URLs. Following Unsplash's rules: photos load from Unsplash's CDN (never copied), the API key stays on the server, each room started from a sample sends Unsplash a download event (with `ixid`), Unsplash+ photos are skipped, the new room sheet credits "Photo by … on Unsplash" with referral links, and a sync makes at most 30 calls. `8629cb2` `2aadd1b` `2e9c0df`

- [x] **Photo upload with limits**: a photo goes from the device straight to R2 through a signed URL (type, size and one file per upload are signed), and the server checks its real format and size before a room uses it. Players see WebP resized to the width on screen (steps of 256, cached in R2, and in expo-image on iOS); originals stay private and links to photos expire. Uploads cost a daily credit per player and per IP, so fresh guest logins can't get around it; an unused upload can be resumed or retried (up to 5 times), and a daily Cron Trigger removes unused uploads and stray files. `057f8b2` `ff0e784` `5a20b0f` `266e32e` `52c680c` `1b425d8` `a33dc93` `8e27ac6` `b979381` `56c2b57` `b0e20a2` `75e9f86` `2031884` `9722156` `2fba25b`
- [x] **Abuse-tested and hardened**: three rounds of an abuse sub-agent against the dev server, plus a full web and iOS test round.
  - Guest and email sign-ups are limited per IP (an IPv6 /64 counts as one), each player's API writes and reads are rate limited, and batches are capped at 8 calls. `b023050` `8175ade` `4b1996d` `533725f` `7e93f56`
  - Rooms are private until shared, and a player picks a readable name (max 40 characters) before sharing or joining; a new name shows to everyone in the room at once. `7ec5da5` `7806715` `1b1de08` `f87be3f` `226573f` `4e79b95`
  - The open-room cap and the 4-player limit hold under parallel requests, and a room over the cap sends the player Home. `d73a7b2`
  - Only a room's players can open its socket, and only from our apps; messages are limited to 20 a second per player over all their sockets, and abandoning cuts their sockets off. `e2d667d` `1389c04` `5c3a12e`
  - Bags are checked (own keys, max 20, printable names, hex colours), long thin photos are refused, photo link expiries must be plain digits, and room codes are 8 characters everywhere. `d1494fd` `4c042cb` `3104b6d` `82d6289`

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
