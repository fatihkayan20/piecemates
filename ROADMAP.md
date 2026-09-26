# Roadmap

Keep this updated as work lands. Move items to **Done** with the commit that shipped them.

## Next

- [ ] **Bags**: create, rename and delete bags. Put selected pieces in a bag and take them out on web and native. `bag:create` and `bag:put` already exist in `packages/game`; drop takes a piece out of a bag.
- [ ] **Sticky edges**: pieces snap to their correct spot on the board frame, not only to neighbours, so the finished puzzle fits the board area.
- [ ] **Reference image button**: show the full image to help solve the puzzle (overlay or popup, web and native).
- [ ] **Unsplash search**: a server route `GET /images/search` keeps the API key server-side and handles attribution plus the required download-tracking call. Replaces the hardcoded sample images on both home screens.
- [ ] **Room settings**: a settings button and sheet on web and native for personal view options (e.g. background colour).
- [ ] **Replace `with-ios-scene.js`**: try `expo-build-properties` instead of the custom plugin.
- [ ] **Photo upload**: `POST /uploads` returns a direct upload URL for R2. The client resizes to about 2048px first (canvas on web, `expo-image-manipulator` on native). Add the R2 host to `ALLOWED_IMAGE_HOSTS` in `apps/server/src/index.ts`.

## Later

- [ ] **Reconnect**: the room socket reconnects on its own after a drop (web and native), instead of showing "disconnected".
- [ ] **Nicknames and player colours**: guests pick a name, and pieces locked by others are tinted in that player's colour instead of only dimmed.
- [ ] **"My puzzles" list**: rooms I created or joined, via `room_players` in D1, so I can resume them.
- [ ] **Completion**: show a finished state and celebration when `isComplete` is true (the server already marks the room `done` in D1).
- [ ] **Accounts**: add email and social login in Better Auth. Guest data already moves to the real account through `onLinkAccount`.
- [ ] **Portrait phones**: the table has one shape for everyone, so a landscape puzzle leaves empty space above and below on a portrait phone. Consider laying the pile out to suit portrait screens.
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
