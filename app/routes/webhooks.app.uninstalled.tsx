// app/routes/webhooks.app.uninstalled.tsx
import type { ActionFunctionArgs } from "react-router";
import shopify from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Get the raw body as text for HMAC validation
  const rawBody = await request.text();

  // 2. Validate the webhook manually using the core library
  const { valid } = await shopify.webhooks.validate({
    rawBody,
    rawRequest: request,
  });

  if (!valid) {
    console.error("Invalid webhook signature received for uninstall");
    return new Response("Unauthorized", { status: 401 });
  }

  // 3. Extract topic and shop from headers
  const topic = request.headers.get("x-shopify-topic") || "";
  const shop = request.headers.get("x-shopify-shop-domain") || "";

  console.log(`Received ${topic} webhook for ${shop}`);

  // 3. Manually delete sessions associated with the validated shop
  // Webhook requests can trigger multiple times; deleteMany ensures all 
  // sessions (online and offline) for this shop are removed.
  await db.session.deleteMany({ 
    where: { shop } 
  });

  console.log(`All sessions deleted for shop: ${shop}`);

  return new Response();
};