# ThriftLink — project conventions for Claude Code

Read this first. Anything below is the **locked product definition**. If a request would change it, surface that and ask before acting.

## What ThriftLink is

A **directory of verified WhatsApp vendors** in Nigeria, plus light marketplace and social features that bring buyers and vendors together.

ThriftLink is not a payment processor. We don't take money for products. We do take money for **vendor premium subscriptions** via manual bank transfer.

## Core user journeys

1. **Buyer browses the directory.** Filters by category, state, condition, verified-only.
2. **Buyer opens a vendor or product.** Sees photos, price, vendor reputation, reviews.
3. **Buyer contacts the vendor directly.**
   - "WhatsApp" button → opens WhatsApp with a prefilled message (tracked as `whatsapp_clicks`).
   - In-app chat (`messages` table + `realtime.js` Socket.IO) for in-platform messaging.
   - Order placement records intent (cart → order → notification to vendor) but no money flows through us.
4. **Vendor manages their shop.** Profile, KYC (NIN + ID document), products, orders, analytics, subscription.
5. **Vendor pays for premium subscription** via manual bank transfer to our Moniepoint account; admin confirms; plan + expiry update.
6. **Social.** Users can chat with users; vendors can chat with vendors. (User↔vendor already works; user↔user is the open extension.)

## What ThriftLink is NOT

- ❌ Not an online checkout. Orders are coordination records, not payments.
- ❌ Not an escrow or wallet provider.
- ❌ Not a logistics provider — delivery is between buyer and vendor.
- ❌ Not a Paystack/Flutterwave integration today (subscriptions are manual transfer only).

## Architecture map

```
backend/                         Express + Socket.IO
├── server.js                    Mounts all routes, serves dist/ in prod
├── realtime.js                  Socket.IO rooms: user:<id>, role:admin
├── database/
│   ├── schema.sql               Authoritative schema (sqlite, will migrate to Postgres)
│   ├── db.js                    Connection + idempotent ALTER migrations
│   └── thriftlink.db            ← EPHEMERAL in this container. See "Known constraints".
├── routes/
│   ├── auth.js                  Register, login, forgot/reset password (Supabase Auth-backed)
│   ├── vendors.js               Public vendor list, vendor profile/products, KYC
│   ├── products.js              Public product search (input-validated)
│   ├── orders.js                Cart→order→vendor notification. NO payment.
│   ├── messages.js              In-app chat (REST + realtime)
│   ├── subscriptions.js         Vendor premium plans + Moniepoint bank-transfer flow
│   ├── payment.js               GET /api/payment/account returns the Moniepoint details
│   ├── admin.js                 KYC review, vendor verify, reports
│   ├── reviews.js, cart.js, users.js, reports.js, webhooks.js
├── services/
│   ├── supabaseService.js       Supabase Auth (register/login/reset)
│   ├── cloudinaryService.js     All image uploads → res.cloudinary.com
│   ├── emailService.js          nodemailer (SMTP) with console fallback
│   └── termiiService.js         Optional SMS; no-op if unconfigured
├── config/subscriptionPlans.js  Source of truth for plans/prices/durations
└── middleware/validate.js       Allowlisted query/body validators

src/                             React (Vite)
├── App.jsx                      All routes
├── context/                     AuthContext, CartContext, RealtimeContext, UIContext
├── services/api.js              Single fetch wrapper, grouped by domain
└── pages/{public,user,vendor,admin}/...
```

## Locked decisions

| Concern | Decision |
|---|---|
| Auth | Supabase Auth + local mirror in `users` table linked by `supabase_user_id`. |
| Image storage | Cloudinary only. Local `/uploads` is a dev fallback. |
| Subscription pricing | `backend/config/subscriptionPlans.js` is the only source — Free / Basic ₦2,000 (30d) / Pro ₦5,000 (30d). |
| Subscription payment | Manual bank transfer (Moniepoint, env-configured). Admin confirms via `PUT /api/subscriptions/admin/payments/:id/review`. |
| Order payment | Out of scope today. `payment_method` is recorded but no charge happens. |
| Realtime | Socket.IO via `realtime.emit(room, event, payload)`. Rooms: `user:<id>`, `role:admin`. |
| Email | SMTP if configured; otherwise console log. Supabase Auth handles its own reset email. |
| Schema migrations | Add to `schema.sql` for new installs **and** `safeAddColumn` in `db.js` for existing DBs. |
| Money | All amounts are Naira (₦). Format with `Number(x).toLocaleString()`. |

## Known constraints (true today)

1. **SQLite is ephemeral.** Container reclaim wipes `backend/database/thriftlink.db`. Migration to Supabase Postgres is the next major PR. Don't ship anything that assumes data survives a session.
2. **No CI / no test suite yet.** Smoke-test by booting the server and curl-ing endpoints, or build the frontend (`npm run build`) before committing.
3. **No rate limiting / helmet headers.** Don't expose new public endpoints without thinking about abuse.

## Conventions

- **Routes always parameterize SQL** via `db.prepare(...).get/all/run(...)`. Never interpolate user input.
- **Public query inputs go through `middleware/validate.js`** (allowlist sort/condition, clamp pagination).
- **Sensitive fields are masked on read** (e.g. NIN/BVN in `GET /api/vendors/me/kyc`).
- **Emails are fire-and-forget** (`sendEmail(...).catch(()=>{})`) — don't block requests on them.
- **New `vendor_profiles` columns** are added via `safeAddColumn` in `db.js`, never inline `ALTER`.
- **`.env` is gitignored**; secrets live in the container env and are hydrated by `.claude/hooks/bootstrap-env.sh`.

## Working in sessions

- Backend auto-starts via `.claude/hooks/start-backend.sh` (SessionStart hook). Logs: `.claude/logs/backend.log`.
- Frontend: `npm run dev` from repo root → http://localhost:5173 (proxies `/api` to :5000).
- A test admin can be created with:
  ```js
  // from backend/
  const Database = require('better-sqlite3');
  const bcrypt = require('bcryptjs');
  const { v4 } = require('uuid');
  const db = new Database('./database/thriftlink.db');
  db.prepare("INSERT OR IGNORE INTO users (id,email,password_hash,name,role,is_active) VALUES (?,?,?,?,?,1)")
    .run(v4(),'admin@thriftlink.test',bcrypt.hashSync('AdminPass1!',10),'Admin','admin');
  ```

## Branch and PR conventions

- Work on `claude/happy-volta-0gxc6z`.
- Open PRs as **draft**. Group changes by intent (don't bundle a bug fix with a feature).
- Commit messages follow `<type>: <short>` (`feat:`, `fix:`, `chore:`, `refactor:`) and explain *why* in the body.

## Definition of done for "100% complete"

The product is shippable when:

1. [x] Verified vendor directory with KYC (NIN + ID document)
2. [x] Buyer can browse, search, filter, view products
3. [x] Buyer can place an order (intent record) and message vendor
4. [x] WhatsApp deep-link works and tracks clicks
5. [x] Vendor dashboard: products, orders, analytics, profile, subscription
6. [x] Vendor premium subscription via manual bank transfer + admin review
7. [x] Admin panel: vendors, KYC, reviews, reports, subscriptions, users
8. [x] In-app chat user↔vendor (realtime)
9. [ ] **In-app chat user↔user and vendor↔vendor** (social extension)
10. [ ] **Data persistence** — SQLite → Supabase Postgres
11. [ ] **Backend security hardening** — rate limiting + helmet headers
12. [ ] **Production deploy** — Vercel (frontend) + Railway/Render (backend) + Supabase (DB)
13. [ ] Remove hardcoded mock vendors on `Home.jsx`; pull from `/api/vendors?featured=true`
14. [ ] Mobile responsiveness pass on key pages (Home, ProductDetails, Checkout, VendorPublicProfile)

Items 9–14 are the only real work left. Everything above the line works today.
