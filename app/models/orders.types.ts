// src/graphql/orders.types.ts

export interface OrdersQueryVariables {
  first: number;
  after?: string | null;
  created_at_min?: string | null;
}

export interface MoneyValue {
  amount: string;
}

export interface MoneySet {
  shopMoney: MoneyValue;
}

export interface ShippingLine {
  title: string | null;
  code: string | null;
}

export interface ShippingLinesConnection {
  edges: Array<{
    node: ShippingLine;
  }>;
}

export interface ShippingAddress {
  countryCodeV2: string | null;
  provinceCode: string | null;
  zip: string | null;
}

export interface ProductSummary {
  title: string;
  vendor: string;
}

export interface VariantSummary {
  title: string;
  barcode: string | null;
  price: string;
  product: ProductSummary;
}

export interface LineItem {
  sku: string | null;
  id: string;
  quantity: number;
  variant: VariantSummary | null;
}

export interface LineItemsConnection {
  edges: Array<{
    node: LineItem;
  }>;
}

export interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  tags: string[];

  totalShippingPriceSet: MoneySet | null;
  totalDiscountsSet: MoneySet | null;
  totalTaxSet: MoneySet | null;
  totalPriceSet: MoneySet | null;

  shippingLines: ShippingLinesConnection;
  shippingAddress: ShippingAddress | null;
  lineItems: LineItemsConnection;
}

export interface OrdersConnection {
  edges: Array<{
    cursor: string;
    node: OrderNode;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface OrdersQueryData {
  orders: OrdersConnection;
}

// This is the shape of r.body when you call client.query<OrdersQueryResponse>(...)
export interface OrdersQueryResponse {
  data: OrdersQueryData;
}