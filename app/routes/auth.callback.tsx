// app/routes/auth.callback.tsx
import { LoaderFunctionArgs, redirect } from "react-router";
import shopify from "../shopify.server";
import sessionUpsert from "../utils/sessionUtils";
import afterAuthJobs from "../utils/authUtils";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    console.log("[auth.callback] Request URL:", request.url);
    
    const url = new URL(request.url);
    
    console.log("[auth.callback] All query params:", Object.fromEntries(url.searchParams));
    console.log("[auth.callback] Calling shopify.auth.callback...");

    // Using web-api adapter - pass request directly
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: context.response,
    });

    const { session } = callbackResponse;
    const shop = session.shop;

    console.log("[auth.callback] Callback response received, session:", shop);

    if(session)
    {
      await sessionUpsert(session);
    }

    await afterAuthJobs(shop);

    // The core library handles saving to PrismaSessionStorage automatically
    // Redirect to your app index or your external signup page
    console.log("[auth.callback] Redirecting to /app");
    return redirect("/app");
  } catch (error: any) {
    console.error("[auth.callback] Error:", error);
    console.error("[auth.callback] Error stack:", error.stack);
    throw error;
  }
};