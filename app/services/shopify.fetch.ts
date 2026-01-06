import { GraphqlClient } from '@shopify/shopify-api';
import { OrdersQueryResponse } from "~/models/orders.types";
import { ORDERS_QUERY } from "~/constants/orders.query";
import { PRODUCTS_QUERY } from "~/constants/products.query";
import { ProductsQueryResponse } from "~/models/products.types";

export async function fetchOrdersBatch(
  client: GraphqlClient,
  cursor: string | null,
  createdAtMin: string,
) {
  const variables = {
    first: 50,
    after: cursor,
    query: `created_at:>=${createdAtMin}`,
  };

  const r = await client.request(ORDERS_QUERY, {
      variables,
  });

  if (!r.data) {
    throw new Error('Missing response data from Admin GraphQL query');
  }

  const orders = r.data.orders;
  const edges = orders.edges;
  const pageInfo = orders.pageInfo;

  const nodes = edges.map((e: any) => e.node);
  const nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

  return { nodes, nextCursor, hasNext: pageInfo.hasNextPage };
}

export async function fetchProductsBatch(
  client: GraphqlClient,
  cursor: string | null,
) {

  const variables = {
    first: 10,
    after: cursor,
  };

  const r = await client.request(PRODUCTS_QUERY,{
      variables,
  });

  if (!r.data) {
    throw new Error('Missing response body from Admin GraphQL query');
  }

  const products = r.data.products;
  const edges = products.edges;
  const pageInfo = products.pageInfo;

  const nodes = edges.map((e: any) => e.node);
  const nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;

  return { nodes, nextCursor, hasNext: pageInfo.hasNextPage };
}
