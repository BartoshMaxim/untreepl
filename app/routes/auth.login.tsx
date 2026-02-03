// app/routes/auth.login.tsx
import { LoaderFunctionArgs, } from "react-router";
import shopify from "../shopify.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log("[auth.login] Request URL:", request.url);
    console.log("[auth.login] Shop parameter:", shop);

    if (!shop) throw new Error("Missing shop parameter");

    const sanitizedShop = shopify.utils.sanitizeShop(shop);
    console.log("[auth.login] Sanitized shop:", sanitizedShop);

    if (!sanitizedShop) {
      throw new Error(`Invalid shop parameter: ${shop}`);
    }

    // Begin the OAuth flow manually
    console.log("[auth.login] Starting OAuth flow for:", sanitizedShop);
    
    let res = context.response;

    // Using web-api adapter - pass request directly
    return await shopify.auth.begin({
      shop: sanitizedShop,
      callbackPath: "/auth/callback",
      isOnline: false,
      rawRequest: request,
      rawResponse: res,
    });

    
  } catch (error: any) {
    console.error("[auth.login] Error:", error);
    console.error("[auth.login] Error stack:", error.stack);
    throw error;
  }
};