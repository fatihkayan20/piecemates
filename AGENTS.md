# Agents and contributors

A multiplayer jigsaw: `apps/web` (TanStack Router + PixiJS), `apps/native` (Expo + Skia), `apps/server` (Hono on Workers, a Durable Object per room), shared code in `packages/*`. Hosting stays at $0. Plans live in `ROADMAP.md`; keep it updated as work lands.

## Rules

Rules marked **(lint)** are enforced by `biome.json` and `biome-plugins/*.grit`; run `pnpm check`. The rest are on review.

1. **Max 150 lines of code per file (lint).** Blank lines and tests don't count. Split big files into components, hooks or modules.
2. **Shared logic lives in packages.** `@puzzle/game` holds the rules. `@puzzle/client` holds everything else that isn't platform specific: room store, drag and drop maths, drop-target hit testing, camera. Apps only render (Pixi on web, Skia on native), wire platform input (pointer events, gesture handler) and use platform APIs.
3. **No prop drilling.** State that crosses components lives in the zustand room store in `@puzzle/client`. Components read it through selectors. React never sees in-place mutation.
4. **No React re-render per frame.** Drag, pan and zoom move things through Reanimated shared values (native) or Pixi directly (web), and only call `setState` on start and end. The budget is 1000 pieces at 60fps.
5. **The server decides outcomes.** Every game rule change goes in `packages/game` with a test; clients never guess outcomes. Logic with a branch in a package gets a `node --test` check.
6. **A feature is done only when it works on web and iOS.** Test both with Argent (Chrome CDP and the iOS simulator) before committing.
7. **One component per file, with a named export and a kebab-case file name (lint).** Hooks go in `hooks/use-*.ts`. Default exports only where a framework requires them (routes, Expo Router screens, the Worker entry, config files).
8. **No hard-coded values in components.** Colours use theme tokens; no `bg-[#...]` (lint). Tuning numbers (tolerance, slot size, max zoom) live as named constants in the package that owns them (lint: `noMagicNumbers`).
9. **Check untrusted input with zod only where it enters, and trust the types inside.** No `as` casts in app code except `as const` (lint). Where a cast is unavoidable, add a `biome-ignore` comment saying why.
10. **Packages expose one public API**, through their `index.ts` or `exports`. Never import `@puzzle/*/src/...` (lint).
11. **Adding a dependency needs a reason in the commit message.** First check the platform, the standard library and the dependencies we already have.
12. **No hand-written memoization.** The React Compiler memoizes, so no `useMemo`, `useCallback`, `memo` (lint) and no `"use no memo"` (lint). If one is really needed, add a `biome-ignore` saying why.

## Workflow

- Don't start dev servers; `pnpm dev` is already running.
- Commit in small scoped pieces (`feat(game): ...`, `fix(web): ...`).
- Run biome only on the files you change: `npx biome check --write <files>`.
