export const ORDERS_QUERY = `query orders($first:Int!, $after:String, $created_at_min:String) {
  orders(first:$first, after:$after, query:$created_at_min) {
    edges {
      cursor
      node {
        id
        name
        createdAt
        tags
        totalShippingPriceSet { shopMoney { amount } }
        totalDiscountsSet     { shopMoney { amount } }
        totalTaxSet           { shopMoney { amount } }
        totalPriceSet         { shopMoney { amount } }
        shippingLines(first:10) {
          edges {
            node {
              title
              code
            }
          }
        }
        shippingAddress {
          countryCodeV2
          provinceCode
          zip
        }
        lineItems(first:10) {
          edges {
            node {
              sku
              id
              quantity
              variant {
                title
                barcode
                price
                product {
                  title
                  vendor
                }
              }
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      startCursor
      endCursor
    }
  }
}`;