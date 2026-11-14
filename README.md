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

## Data

There is no live backend in this version. Every screen reads from `src/data/seed.ts`, a deterministic generator
(about 95k orders, 20k customers, 58 products, 8 connectors) calibrated so the last 30 days land on:
revenue $1.24M (+12.4% vs the previous 30 days), net margin 28.4%, AOV $142.50, retention 42.1%.
All other numbers, charts and Ask AI tables are computed from the same rows.

Check the calibration any time: `npx tsx scripts/check-seed.ts`

### Loading it into Supabase / PostgreSQL

1. Run `db/schema.sql`
2. Run `db/seed.sql` (customers, products, connectors and the last 14 days of orders)
3. For the full year: `npm run db:seed -- --days=365` (about 95k orders, large file, load with `psql`)

## Ask AI

Scripted, not a live model. Six analyses are matched by keyword and run against the seed data
(`src/data/askEngine.ts`): margin decline, Q3 regions, VIP lifetime value, 14-day stock-outs, channel trend,
category profit. Anything else returns an honest fallback with suggestions. The SQL shown is valid PostgreSQL
for `db/schema.sql`. Wiring a real text-to-SQL model means replacing `answer()` and executing through a read-only role.

## Connectors

The add-connector wizard and test flow are simulated (DNS, TCP ping, TLS, auth, schema introspection) with a
toggle to simulate an authentication failure. No credentials leave the browser. CSV upload parses the real file header.
