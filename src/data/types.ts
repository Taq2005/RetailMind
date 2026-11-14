export type Segment = "VIP" | "Regular" | "At-Risk";
export type Region = "North America" | "EMEA" | "APAC" | "LATAM";
export type Channel = "Online" | "In-Store";
export type OrderStatus = "Completed" | "Processing" | "Returned" | "Cancelled";
export type ConnectorType = "PostgreSQL" | "Snowflake" | "REST API" | "CSV";
export type ConnectorStatus = "Healthy" | "Syncing" | "Error";

export type Category =
  | "Outerwear"
  | "Denim"
  | "Footwear"
  | "Accessories"
  | "Audio"
  | "Wearables"
  | "Laptops & Tablets"
  | "Smart Home";

export interface Customer {
  id: number;
  name: string;
  email: string;
  segment: Segment;
  region: Region;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: Category;
  cost_price: number;
  retail_price: number;
  stock_quantity: number;
  reorder_level: number;
}

export interface Order {
  id: number;
  customer_id: number;
  channel: Channel;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  discount_amount: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  /** Line margin in percentage points, e.g. 31.42 */
  profit_margin: number;
}

export interface Connector {
  id: number;
  name: string;
  type: ConnectorType;
  status: ConnectorStatus;
  last_sync: string;
  host_masked: string;
  row_count: number;
}

export type RangeKey = "30d" | "qtd" | "ytd";
export type ChannelFilter = "all" | "online" | "store";
