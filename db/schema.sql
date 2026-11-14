-- RetailMind demo workspace: Northwind Apparel & Tech
-- PostgreSQL 14+ (Supabase compatible). Run this first, then seed.sql.
-- Safe to re-run: it drops and recreates the demo tables.

DROP TABLE IF EXISTS order_items, orders, products, customers, connectors CASCADE;
DROP TYPE  IF EXISTS customer_segment, order_channel, order_status, connector_type, connector_status;

CREATE TYPE customer_segment AS ENUM ('VIP', 'Regular', 'At-Risk');
CREATE TYPE order_channel    AS ENUM ('Online', 'In-Store');
CREATE TYPE order_status     AS ENUM ('Completed', 'Processing', 'Returned', 'Cancelled');
CREATE TYPE connector_type   AS ENUM ('PostgreSQL', 'Snowflake', 'REST API', 'CSV');
CREATE TYPE connector_status AS ENUM ('Healthy', 'Syncing', 'Error');

CREATE TABLE customers (
  id          integer          PRIMARY KEY,
  name        text             NOT NULL,
  email       text             NOT NULL UNIQUE,
  segment     customer_segment NOT NULL,
  region      text             NOT NULL CHECK (region IN ('North America', 'EMEA', 'APAC', 'LATAM')),
  created_at  timestamptz      NOT NULL
);

CREATE TABLE products (
  id             integer       PRIMARY KEY,
  name           text          NOT NULL UNIQUE,
  category       text          NOT NULL,
  cost_price     numeric(10,2) NOT NULL CHECK (cost_price >= 0),
  retail_price   numeric(10,2) NOT NULL CHECK (retail_price >= 0),
  stock_quantity integer       NOT NULL CHECK (stock_quantity >= 0),
  reorder_level  integer       NOT NULL CHECK (reorder_level >= 0)
);

CREATE TABLE orders (
  id               integer       PRIMARY KEY,
  customer_id      integer       NOT NULL REFERENCES customers(id),
  channel          order_channel NOT NULL,
  order_date       timestamptz   NOT NULL,
  status           order_status  NOT NULL,
  total_amount     numeric(12,2) NOT NULL CHECK (total_amount >= 0),  -- after discount
  discount_amount  numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0)
);

CREATE TABLE order_items (
  id             integer       PRIMARY KEY,
  order_id       integer       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     integer       NOT NULL REFERENCES products(id),
  quantity       integer       NOT NULL CHECK (quantity > 0),
  unit_price     numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  profit_margin  numeric(6,2)  NOT NULL   -- line margin in percentage points, e.g. 31.42
);

CREATE TABLE connectors (
  id          integer          PRIMARY KEY,
  name        text             NOT NULL,
  type        connector_type   NOT NULL,
  status      connector_status NOT NULL,
  last_sync   timestamptz      NOT NULL,
  host_masked text             NOT NULL,   -- never store the real host or credentials here
  row_count   bigint           NOT NULL DEFAULT 0
);

CREATE INDEX orders_order_date_idx   ON orders (order_date);
CREATE INDEX orders_customer_idx     ON orders (customer_id);
CREATE INDEX orders_channel_date_idx ON orders (channel, order_date);
CREATE INDEX order_items_order_idx   ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);
CREATE INDEX customers_segment_idx   ON customers (segment);

-- Ask AI runs generated SQL through a read-only role. Create it and grant SELECT only.
-- CREATE ROLE retailmind_readonly NOLOGIN;
-- GRANT USAGE ON SCHEMA public TO retailmind_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO retailmind_readonly;
