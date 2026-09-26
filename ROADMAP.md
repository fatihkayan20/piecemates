# Roadmap

Keep this updated as work lands. Move items to **Done** with the commit that shipped them.

## Next

- [ ] **Room settings**: a settings button and sheet on web and native for personal view options (e.g. background colour).
- [ ] **Replace `with-ios-scene.js`**: try `expo-build-properties` instead of the custom plugin.
- [ ] **Photo upload**: `POST /uploads` returns a direct upload URL for R2. The client resizes to about 2048px first (canvas on web, `expo-image-manipulator` on native). Add the R2 host to `ALLOWED_IMAGE_HOSTS` in `apps/server/src/index.ts`.
- [ ] **Unsplash search**: a server route `GET /images/search` keeps the API key server-side and handles attribution plus the required download-tracking call. Replaces the hardcoded sample images on both home screens.

## Later

- [ ] **Reconnect**: the room socket reconnects on its own after a drop (web and native), instead of showing "disconnected".
- [ ] **Nicknames and player colours**: guests pick a name, and pieces locked by others are tinted in that player's colour instead of only dimmed.
- [ ] **"My puzzles" list**: rooms I created or joined, via `room_players` in D1, so I can resume them.
- [ ] **Completion**: show a finished state and celebration when `isComplete` is true (the server already marks the room `done` in D1).
- [ ] **Accounts**: add email and social login in Better Auth. Guest data already moves to the real account through `onLinkAccount`.
- [ ] **Portrait phones**: the table has one shape for everyone, so a landscape puzzle leaves empty space above and below on a portrait phone. Consider laying the pile out to suit portrait screens.
- [ ] **Who is in which bag**: show on each bag chip which players are looking at it (a presence field).
- [ ] **Performance at 1000 pieces**:
  - Native gestures run on the JS thread; move them to worklets if dragging stutters.
  - Consider Skia `Atlas` instead of one clip group per piece.
  - Room state is saved as one Durable Object key (about 60 KB); split it if it grows.
- [ ] **Piece shape variety**: all tabs currently share one shape; add per-edge random jitter from the seed.
- [ ] **Touch pinch-zoom on web**: web currently zooms only with the mouse wheel.
- [ ] **Android**: dev build and a device test pass.
- [ ] **Expo SDK 58**: upgrade, then delete `apps/native/plugins/with-ios-scene.js`.
- [ ] **Cloudflare overview**: usage, limits and monitoring for Workers, Durable Objects, D1 and R2 on the free plan.
- [ ] **First deploy**: `pnpm run deploy`, set `CORS_ORIGIN` to the deployed web origin, then deploy again. Host the web app and server on sibling subdomains (`app.` / `api.`) so the auth cookie works for WebSockets.

## Done

- [x] Monorepo scaffold (Better-T-Stack: TanStack Router, Expo, Hono on Workers, D1, Better Auth). `a589b30`
- [x] Shared game rules in `packages/game`: shapes from a seed, grid options, lock/drop/snap/bag/tidy, message checks. `8d78c3b`
- [x] D1 tables `rooms` and `room_players`. `91866ef`
- [x] Anonymous guest sign-in; a guest's rooms move to their real account when they link one. `47789a0`
- [x] Room Durable Object with WebSockets, max 4 players, state saved per room. `9da65f9`
- [x] Web board (PixiJS): drag, lock, drop, snap, pan, wheel zoom, tidy. `2092713`
- [x] iOS dev build and native board (Skia), in sync with web. `cab20bb`, `4a98d6d`
- [x] Shared `@puzzle/client` package (API, session, room connection, camera) and clearer names across game, web and native. `13cfea8`…`90e4917`
- [x] Table with the pile around the board, drops kept on the table, zoom and pan limits, local-only tidy. `221299e`…`f28ef01`
- [x] Bags: a shared bag bar on web and iOS, drop a piece or group on a bag, a per-device bag view (the bag plus the puzzle so far), groups kept inside bags, take-out zone, create/edit sheet (shadcn on web, Expo UI on iOS). `00f3463`…`5d391c1`
- [x] Sticky edges: a frame piece dropped near its spot on the board sticks there with its group; a bag piece that sticks leaves its bag. `d575c83`
- [x] Placed pieces are fixed: a group in its correct spot can't be picked up or bagged; grabbing it pans the camera. `6935266`
- [x] Reference image: an Image button opens the full picture in a popup (shadcn dialog on web, fading modal on native). `d93ac75` `88fd227`
- [x] Repo rules in `AGENTS.md`, enforced by biome and grit plugins; boards, bag bars and game rules split into small modules around a shared zustand room store. `fe11e50`..`673bbcc`
