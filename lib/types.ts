// lib/etl/types.ts
export type UnifiedRow = {
  order_id: string;
  order_date: string;
  channel: string;
  sku: string;
  product_name: string;
  quantity: number | string;
  unit_price: number;
  gross_revenue: number;
  platform_fee: number;
  net_revenue: number;
  currency: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  payment_method: string;
};

export type ETLResult = {
  rows: number;
  errors: string[];
  preview: UnifiedRow[];
};
