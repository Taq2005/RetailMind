# RetailMind

Natural-language retail analytics, built as a React + TypeScript + Tailwind + shadcn-style UI + Recharts + Framer Motion app.
Demo workspace: Northwind Apparel & Tech, an omnichannel apparel and electronics retailer at about $12M a year.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run typecheck
```

Routes: `/` landing page with the sticky walkthrough, `/app` overview, `/app/ask`, `/app/connectors`.
Data Sources, Analytics, Reports and Settings have designed empty states.
Open search with Cmd/Ctrl+K.

### Authentication

The app uses Supabase Auth for email/password sign-up and sign-in. Create a Supabase project, enable email authentication, then create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set to the project URL and public anon key. Configure the Supabase Site URL and allowed redirect URLs for your local and deployed app URLs. Restart the Vite dev server after changing environment variables. Never put the Supabase `service_role` key in this frontend or share it in chat.

All `/app` routes require a signed-in account. Only the authenticated `demo@gmail.com` account gets the generated Northwind demo analytics; other accounts see an empty sales-data state. Create and verify `demo@gmail.com` in Supabase Auth, then sign in with the password you set there. Ordinary users do not yet have a data-import path, and the simulated connector changes remain browser-local.

The demo data is generated in the frontend and is fictional—not private customer data. This email-based demo switch is for the prototype only; it is not database row-level security. Before loading real business data, move it behind Supabase tables with owner IDs and row-level security policies.

## Data

The demo account reads from `src/data/seed.ts`, a deterministic generator
(about 95k orders, 20k customers, 58 products, 8 connectors) calibrated so the last 30 days land on:
revenue $1.24M (+12.4% vs the previous 30 days), net margin 28.4%, AOV $142.50, retention 42.1%.
All dashboard numbers, charts and Ask AI tables for that account are computed from the same rows. Other accounts do not load this dataset.

Check the calibration any time: `npx tsx scripts/check-seed.ts`

### Prototype SQL files

`db/schema.sql` and `db/seed.sql` are prototype/demo scripts with no per-user ownership or row-level security. They are not wired to the app and must not be used to store real multi-user data. For an isolated demo database, run `db/schema.sql` then `db/seed.sql`; a full-year seed can be generated with `npm run db:seed -- --days=365`.

## Ask AI

Scripted, not a live model. Six analyses are matched by keyword and run against the seed data
(`src/data/askEngine.ts`): margin decline, Q3 regions, VIP lifetime value, 14-day stock-outs, channel trend,
category profit. Anything else returns an honest fallback with suggestions. The SQL shown is valid PostgreSQL
for `db/schema.sql`. Wiring a real text-to-SQL model means replacing `answer()` and executing through a read-only role.

## Connectors

The add-connector wizard and test flow are simulated (DNS, TCP ping, TLS, auth, schema introspection) with a
toggle to simulate an authentication failure. No credentials leave the browser. CSV upload parses the real file header.
