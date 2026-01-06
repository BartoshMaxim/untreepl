
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log("app.$.tsx loader called");
  try {
  await authenticate.admin(request);
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    // Only log actual errors
    console.error("Authentication error in loader:", error);
    throw error;
  } finally {
    console.log("app.$.tsx loader process.env.SHOPIFY_API_KEY",process.env.SHOPIFY_API_KEY);
  }
  

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
