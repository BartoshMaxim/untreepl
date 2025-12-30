// Media

export type MediaTypeName = 'MediaImage' | string;

export interface MediaImage {
  __typename: 'MediaImage';
  image: {
    url: string;
  } | null;
}

export interface GenericMedia {
  __typename: MediaTypeName;
}

export type ProductMediaNode = MediaImage | GenericMedia;

export interface ProductMediaConnection {
  edges: Array<{
    node: ProductMediaNode;
  }>;
}

// Inventory & measurement

export interface InventoryQuantity {
  quantity: number;
}

export interface InventoryLevelLocation {
  name: string;
  fulfillmentService: {
    requiresShippingMethod: boolean;
  } | null;
}

export interface InventoryLevelNode {
  quantities: InventoryQuantity[];
  location: InventoryLevelLocation;
}

export interface InventoryLevelsConnection {
  edges: Array<{
    node: InventoryLevelNode;
  }>;
}

export interface WeightMeasurement {
  unit: string;
  value: number;
}

export interface ProductMeasurement {
  weight: WeightMeasurement | null;
}

export interface InventoryItem {
  inventoryLevels: InventoryLevelsConnection;
  measurement: ProductMeasurement | null;
}

// Variants

export interface VariantImage {
  url: string;
}

export interface ProductVariant {
  barcode: string | null;
  image: VariantImage | null;
  sku: string | null;
  title: string;
  id: string;
  inventoryQuantity: number;
  inventoryItem: InventoryItem | null;
}

export interface ProductVariantsConnection {
  edges: Array<{
    node: ProductVariant;
  }>;
}

// Product & products connection

export interface ProductNode {
  title: string;
  media: ProductMediaConnection;
  variants: ProductVariantsConnection;
}

export interface ProductsConnection {
  edges: Array<{
    cursor: string;
    node: ProductNode;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

// Top-level query response

export interface ProductsQueryData {
  products: ProductsConnection;
}

export interface ProductsQueryResponse {
  data: ProductsQueryData;
}