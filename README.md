# Toolshed — full CRUD, frontend talking to my own backend

Task 03 of the Neurofive Solutions Full Stack Web Development internship:
*Full CRUD: frontend talking to your own backend.*

A React client and an Express + SQLite API for the Kirkgate Toolshed catalogue.
No public API this time — I wrote both ends.

```
03-crud-toolshed/
├── server/   Express 4 + better-sqlite3   → http://localhost:4000
└── client/   React 19 + Vite              → http://localhost:5173
```

I kept it as one repo with two packages rather than two repos: the client and
the API change together at this stage, and one `git clone` is less friction for
whoever reviews it.

---

## Run it

Two terminals.

```bash
# terminal 1 — API
cd server
cp .env.example .env
npm install
npm run seed          # 12 tools to start with
npm run dev           # http://localhost:4000

# terminal 2 — client
cd client
npm install
npm run dev           # http://localhost:5173
```

Vite proxies `/api` to port 4000 in development, so there is no CORS in the loop
and no hard-coded `localhost` anywhere in the client source. In production the
client reads `VITE_API_URL`.

**Seeing the loading states:** localhost is too fast to see them. Start the API
with `SLOW_MODE=1 npm run dev` to add 600ms to every request — the skeletons,
button spinners and disabled states all become visible. That flag is
development-only.

## The API

Base URL `/api`. One response envelope for everything: `{ data, meta }` on
success, `{ error: { message, fields? } }` on failure.

| Method | Path | Does | Codes |
|---|---|---|---|
| `GET` | `/tools` | list, optional `?q=` `?category=` `?status=` | 200 |
| `GET` | `/tools/:id` | one tool | 200, 404 |
| `POST` | `/tools` | create | 201, 400, 409 |
| `PATCH` | `/tools/:id` | partial update | 200, 400, 404, 409 |
| `DELETE` | `/tools/:id` | remove, returns the deleted row | 200, 404 |
| `GET` | `/health` | liveness | 200 |

`PATCH` rather than `PUT` because the UI's most common write is a one-field
status change, and making the client send the whole object back to flip one
field invites lost updates.

`409` is its own case: a duplicate asset tag is not a validation error in the
"you typed it wrong" sense, it is a collision with data the user cannot see.
The message names the tag so they can go and look.

## Data model

```sql
tools(id, asset_tag UNIQUE, name, category, shelf,
      deposit, status CHECK(in|out|repair), notes,
      created_at, updated_at)
```

The database speaks `snake_case`, the API speaks `camelCase`, and exactly one
function (`toApi` in `server/src/db.js`) converts between them. Statements are
all prepared and parameterised — no string-built SQL anywhere.

## Loading and error states, per action

The brief's phrase was "so nothing feels instant/fake". What that meant in
practice:

- **List load** — skeleton cards in the real card shape, not a centred spinner.
- **Create / save** — submit button becomes `Saving…` with an inline spinner and
  every field in the form disables. You cannot double-submit.
- **Status change** — spins on *that row only*. Lending one drill does not grey
  out the other eleven tools.
- **Retire** — confirmation dialog first, then the dialog's own button spins
  while the request runs and the dialog cannot be dismissed mid-flight.
- **Every outcome gets a toast**, success or failure, naming the asset tag.
- **Failure never loses your work.** A rejected create leaves the form filled in
  with the server's field errors merged into the client's own.

I deliberately did **not** use optimistic updates. They would make this feel
faster, but the task is about showing the request actually happening, and an
optimistic UI that silently rolls back is harder to demo honestly.

## State management

Local React state, lifted to `App`. That is the right call for this size:

- `tools` — the list, mutated in place after each successful write rather than
  refetching. One round trip per action, not two.
- `rowBusy` — a map of `id → action`, which is what makes per-row spinners work
  without a re-render storm.
- `formBusy` / `serverFields` — the form's own lifecycle.

**Task 06 replaces this with a global store**, once auth and a second resource
make prop-drilling actually hurt. Reaching for Redux here would be answering a
question nobody asked.

## Validation

Both ends, with matching rules:

| Field | Rule |
|---|---|
| `assetTag` | required, `TS-` + 4 digits, unique |
| `name` | required, 2–80 chars |
| `category` | one of power, garden, decorate, access, measure, hand |
| `shelf` | required, ≤ 12 chars |
| `deposit` | 0–500, integer |
| `status` | in / out / repair |
| `notes` | ≤ 400 chars |

Client validation is for speed of feedback. Server validation is the one that
counts — `server/src/lib/validate.js` re-checks everything, and its per-field
error object renders in exactly the same place as the client's own messages.
Task 05 goes deeper on this.

## Verification

Every endpoint was exercised against a running server:

| Case | Result |
|---|---|
| list all | 200, 12 rows |
| `?category=garden` | 200, 3 rows |
| `?q=ladder` | 200, TS-0140 only |
| create valid | **201** with the created row |
| create with 5 bad fields | **400** with all 5 field messages |
| create duplicate tag | **409** naming the tag |
| patch status + shelf | 200, `updated_at` moved |
| patch invalid status | 400 |
| patch empty body | 400 "send at least one field" |
| get missing id | 404 |
| delete then refetch | 200 then 404 |
| unknown endpoint | 404 |

Client builds clean: 39 modules, 65 KB gzipped JS.

## Deploy

- **API** — Render / Railway / Fly. Set `PORT`, `CORS_ORIGIN` (your client's
  origin) and `DATABASE_PATH` pointing at a mounted disk. SQLite on an ephemeral
  filesystem loses data on redeploy; the disk mount is the fix.
- **Client** — Netlify / Vercel, build `npm run build`, publish `dist`, and set
  `VITE_API_URL` to the deployed API origin.

