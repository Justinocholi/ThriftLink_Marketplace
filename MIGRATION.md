# #10 — SQLite → Supabase Postgres migration

Status: **route layer fully converted (dual-mode). Final activation steps pending.**

## Where it stands now
Every active route file reads/writes through async repositories when
`DATA_BACKEND=supabase`, and falls back to the original `better-sqlite3`
path when unset/`sqlite` (the default). The live app is unaffected until the
flag is flipped.

Converted + live-tested in Supabase mode: products, vendors (public + me/* +
KYC), auth, cart, users, reviews, reports, subscriptions, admin, messages
(send/thread), orders (reads). `webhooks.js` (Paystack, unused) intentionally
left on SQLite.

Three endpoints are coded but need the Postgres RPCs to function:
checkout (`place_order`), chat conversation list (`conversation_list`),
admin stats (`vendor_stats`).

### To finish (≈10 min + a smoke test)
1. Run `backend/database/postgres-functions.sql` in the Supabase SQL Editor.
2. Set `DATA_BACKEND=supabase` (add it to the environment so the
   bootstrap-env hook persists it across sessions).
3. Smoke-test every flow; confirm checkout, chat conversation list, and the
   admin dashboard stats now work.
4. Once green, retire `better-sqlite3`: delete the SQLite branches and the
   `database/db.js` handle. (Left in place now as a safety net.)

---

## Original reconnaissance (kept for reference)
Status: **foundation laid, reconnaissance complete.**

## What we learned (reconnaissance from inside the container)

| Probe | Result |
|---|---|
| Supabase REST API (PostgREST) over HTTPS | ✅ 200 with service-role key |
| Direct Postgres `db.<ref>.supabase.co:5432` | ❌ DNS does not resolve (modern Supabase exposes only the pooler) |
| Pooler `:6543` / `:5432` | ❌ TCP **blocked** by the container network policy (timeout) |
| `exec_sql` RPC for DDL | ❌ does not exist |
| Supabase Management API (`api.supabase.com`) | reachable but 401 (needs a Personal Access Token we don't have) |
| Tables already in Supabase `public` schema | ✅ **all 15 exist** |
| Data volume | tiny — 2 users, 1 vendor, 0 products/orders/messages |
| Schema freshness | ⚠️ **outdated** — missing today's columns (`is_featured`, `featured_rank`, all KYC fields, order payment fields, reset-token fields) |

### The decisive constraint
From this container, **the only way to reach Supabase is PostgREST over HTTPS** (port 443). The raw Postgres wire protocol ports are blocked, and we have no DB password anyway. Therefore:

- We **cannot** use `pg`/raw SQL from the app. The migration target is the **`@supabase/supabase-js` PostgREST client** (already installed, already used for Auth).
- We **cannot** run DDL from the app. Schema changes must be pasted into the **Supabase SQL Editor** by a human.

## Step 1 — bring the Supabase schema current (human action, ~1 min)
Open Supabase Dashboard → SQL Editor → New query → paste the contents of
`backend/database/postgres-schema.sql` → Run. It is fully idempotent: it
creates any missing tables and `alter ... add column if not exists` tops up
the older tables with the new columns. Safe to re-run.

## Step 2 — application rewrite (the large task)
Every route file currently uses synchronous `better-sqlite3`
(`db.prepare(...).get/all/run`). These must become asynchronous
`supabase-js` calls. Scope and the non-trivial parts:

| Concern | SQLite today | Supabase target |
|---|---|---|
| Booleans | `integer` 0/1, compared `= 1` | real `boolean` — send `true/false`, map on read |
| Timestamps | naive strings; some code appends `'Z'` | `timestamptz` ISO — remove the `+ 'Z'` hacks (messages.js online/typing) |
| Simple reads | `SELECT ... WHERE` | `.from(t).select().eq()...` |
| JOINs (products↔vendor_profiles, orders↔vendors, messages↔users) | SQL `JOIN` | PostgREST embedded resources (`select=*,vendor_profiles(*)`) **or** declared FKs; verify FK names exist |
| Aggregates (conversation list, unread counts, vendor stats) | `GROUP BY`, correlated subqueries | not expressible in PostgREST → **Postgres RPC functions** or multiple round-trips |
| Transactions (`orders.js` checkout: insert order + items + decrement stock + cart clear atomically) | `db.transaction()` | PostgREST has no multi-statement txn → **a Postgres function** (`create function place_order(...)`) invoked via `.rpc()` |
| Search `LIKE` | `LIKE ?` | `.ilike()` |

### Recommended approach: repository layer + atomic cutover
1. Add `backend/repos/*.js` — one async module per domain (users, vendors,
   products, orders, messages, …) wrapping supabase-js. This isolates the
   data layer so routes change shape minimally (handlers become `async`).
2. Write the needed Postgres **RPC functions** (checkout, conversation list,
   vendor stats) as SQL the user runs once (Step 1's file can include them).
3. Convert all routes to `async` and point them at the repos.
4. Flip a single `DATA_BACKEND=supabase` flag; delete `better-sqlite3` once green.

This is an **atomic** change — you can't run half on SQLite and half on
Supabase or the two stores diverge. Estimated 6–10h of careful work plus a
full re-test of every endpoint. It should be its own PR, reviewed as a unit.

## Why it wasn't completed in-session
The rewrite is large, atomic, and high-risk to the currently-working app,
and it can't be end-to-end tested until Step 1 (human SQL-Editor action) is
done. The safe move was to finish the reconnaissance, port + future-proof the
schema, and document the exact plan — rather than half-rewrite 11 route files
and leave the app broken.

## Decision needed before the rewrite
See the question raised in chat:
- **A (recommended):** run Step 1, then I do the full supabase-js rewrite as a dedicated PR.
- **B:** relax the environment network policy to allow the Supabase pooler port (6543) and provide the DB connection string — then I can use `pg` + raw SQL, a far more mechanical port (`?`→`$n`, sync→async) that keeps real transactions and needs no RPC functions.
