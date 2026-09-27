# Architecture

How Piecemates fits together, for planning and for picking the project back up. Rules for contributors are in `AGENTS.md`; plans are in `ROADMAP.md`.

## The whole project

```mermaid
flowchart LR
  subgraph Clients["Clients (render + input only)"]
    direction TB
    Web["apps/web<br/>TanStack Router + PixiJS<br/>routes: / , /history, /room/$code"]
    Native["apps/native<br/>Expo Router + Skia<br/>Home, History (drawer), room/[code]"]
  end

  subgraph Shared["Shared packages"]
    direction TB
    Game["@piecemates/game<br/>rules: apply(), snap, rotate, bags,<br/>table + pile layout, clock, shapes, zod messages"]
    Client["@piecemates/client<br/>RoomConnection, zustand room store,<br/>camera + followRoom, drag / drop targets,<br/>settings (bg, sounds, music), i18next en.ts,<br/>API client, History text"]
    Telemetry["@piecemates/telemetry<br/>Sentry + PostHog options"]
    UI["@piecemates/ui<br/>shadcn components (web)"]
    Auth["@piecemates/auth<br/>Better Auth: anonymous guests,<br/>email, Expo plugin"]
    DB["@piecemates/db<br/>Drizzle schema + migrations"]
  end

  subgraph CF["Cloudflare (local: workerd via alchemy dev, packages/infra)"]
    direction TB
    Worker["apps/server Worker (Hono)<br/>/api/auth/*, GET/POST /rooms,<br/>GET /rooms/:code, /rooms/:code/ws"]
    DO[("Room Durable Object<br/>one per room code<br/>authoritative State, hibernating sockets")]
    D1[("D1 (SQLite)<br/>user, session, account,<br/>rooms, room_players")]
    Assets["Web static assets<br/>(Cloudflare Website)"]
  end

  Unsplash["images.unsplash.com<br/>(puzzle images)"]
  Sentry["Sentry"]
  PostHog["PostHog"]

  Web --> Client
  Native --> Client
  Web --> UI
  Client --> Game
  Client --> Telemetry
  Worker --> Game
  Worker --> Auth
  Auth --> DB
  Worker --> DB
  DO --> Game

  Web -- "HTTP (cookie)" --> Worker
  Native -- "HTTP (cookie header)" --> Worker
  Web -. "WebSocket" .-> Worker
  Native -. "WebSocket" .-> Worker
  Worker -- "getByName(code).fetch / init()" --> DO
  Worker -- "Drizzle" --> D1
  DO -- "played_ms, status, finished_at" --> D1
  Assets --> Web
  Web -- "image pixels" --> Unsplash
  Native -- "image pixels" --> Unsplash
  Clients -.-> Sentry
  Worker -.-> Sentry
  Clients -.-> PostHog
```

- **Who decides:** the Room Durable Object runs `apply()` from `@piecemates/game` on every message and broadcasts what it accepted. Clients run the same `apply()` on the echo, so everyone's state stays identical. Only the dropped piece's position travels.
- **What is stored where:** live piece state lives in the Durable Object's storage (one `state` key per room). D1 only indexes rooms: who owns them, who played, the seed and grid, play time and whether it's solved (for History).
- **The server never touches pixels:** piece shapes come from `(seed, rows, cols)`, so every client cuts the same puzzle from the image URL.
- **Per device, never sent:** the camera, which bag I'm looking at, my tidy positions, and my settings (table colour, sounds, haptics, music).

## A room's life

```mermaid
sequenceDiagram
  autonumber
  actor P as Player (web or iOS)
  participant C as @piecemates/client
  participant W as Worker (Hono)
  participant A as Better Auth
  participant D1 as D1
  participant R as Room DO

  P->>C: open the app
  C->>A: getSession, else sign in anonymously
  A->>D1: user + session rows
  P->>C: pick image, piece count, turned pieces (sheet)
  C->>W: POST /rooms {imageUrl, size, rows, cols, rotate}
  W->>D1: insert rooms + room_players (owner)
  W->>R: init(code, seed, rows, cols, w, h, rotate)
  R->>R: createState: shuffle into pile, random turns, save
  W-->>C: {code}
  C->>W: GET /rooms/:code (also joins room_players)
  C->>W: GET /rooms/:code/ws (upgrade)
  W->>R: fetch with x-user-id / x-user-name
  R-->>C: state + presence (clock resumes)
  loop playing
    P->>C: drag / tap / bag
    C->>R: lock, drop, rotate, bag:put, ...
    R->>R: apply(): snap, stick to frame, keep on table
    R-->>C: applied (to everyone) or rejected (to me)
    C->>C: apply() on the echo, store snapshot, camera follows
  end
  R->>D1: last player leaves or solved: played_ms (+ done, finished_at)
  P->>C: History
  C->>W: GET /rooms
  W->>D1: my rooms + other players' names
```

## Where to look

| Concern | Code |
| --- | --- |
| Game rules and their tests | `packages/game/src/*.ts`, `game.test.ts` |
| Room socket, local copy, cues | `packages/client/src/room-connection.ts` |
| What React reads | `packages/client/src/room-store.ts` |
| Camera maths and following the room | `packages/client/src/camera.ts`, `camera-follow.ts` |
| Web board | `apps/web/src/hooks/use-pixi-board.ts`, `lib/pixi/*` |
| Native board | `apps/native/components/board/*`, `hooks/use-board-gestures.ts`, `lib/camera.ts` |
| HTTP API | `apps/server/src/index.ts`, `history.ts` |
| Room authority | `apps/server/src/room.ts` |
| Tables | `packages/db/src/schema/*.ts`, migrations in `packages/db/src/migrations` |
| Cloudflare resources | `packages/infra/alchemy.run.ts` |
