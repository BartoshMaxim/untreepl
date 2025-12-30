export const PRODUCTS_QUERY = `
  query products($first:Int!, $after:String) {
    products(first:$first, after:$after) {
      edges {
        cursor
        node {
          media(first:10) {
            edges {
              node {
                __typename
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
          title
          variants(first:10) {
            edges {
              node {
                barcode
                image {
                  url
                }
                sku
                title
                id
                inventoryQuantity
                inventoryItem {
                  inventoryLevels(first:50) {
                    edges {
                      node {
                        quantities(names: "available") {
                          quantity
                        }
                        location {
                          name
                          fulfillmentService {
                            requiresShippingMethod
                          }
                        }
                      }
                    }
                  }
                  measurement {
                    weight {
                      unit
                      value
                    }
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
  }
`;