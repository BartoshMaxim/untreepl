export function transformOrderTo3PL(node: any) {
  return {
    externalOrderId: node.id,
    number: node.name,
    createdAt: node.createdAt,
    totals: {
      shipping: node.totalShippingPriceSet?.shopMoney?.amount ?? "0",
      discounts: node.totalDiscountsSet?.shopMoney?.amount ?? "0",
      tax: node.totalTaxSet?.shopMoney?.amount ?? "0",
      total: node.totalPriceSet?.shopMoney?.amount ?? "0"
    },
    shipping: {
      method: node.shippingLines?.edges?.[0]?.node?.title ?? null,
      country: node.shippingAddress?.countryCodeV2 ?? null,
      state: node.shippingAddress?.provinceCode ?? null,
      zip: node.shippingAddress?.zip ?? null
    },
    items: (node.lineItems?.edges ?? []).map((e: any) => ({
      sku: e.node.sku,
      orderLineId: e.node.id,
      variantExternalId: e.node.variant?.id ?? null,
      name: `${e.node.variant?.product?.title ?? ""} ${e.node.variant?.title ?? ""}`.trim(),
      barcode: e.node.variant?.barcode ?? null,
      qty: e.node.quantity,
      price: e.node.variant?.price ?? "0",
      brand: e.node.variant?.product?.vendor ?? null
    }))
  };
}

export function transformProductVariantTo3PL(product: any, variantNode: any) {
  return {
    productTitle: product.title,
    variantTitle: variantNode.title,
    sku: variantNode.sku,
    barcode: variantNode.barcode,
    externalId: variantNode.id,
    quantity: variantNode.inventoryItem?.inventoryLevels?.edges?.[0]?.node?.quantities?.[0]?.quantity ?? variantNode.inventoryQuantity ?? 0,
    weight: variantNode.inventoryItem?.measurement?.weight?.value ?? null,
    imageUrl: variantNode.image?.url ?? product.media?.edges?.[0]?.node?.image?.url ?? null,
    vendor: variantNode.vendor ?? product.vendor ?? null
  };
}
