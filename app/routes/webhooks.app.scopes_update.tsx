// app/routes/webhooks.app.scopes_update.tsx
import type { ActionFunctionArgs } from "react-router";
import shopify from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Get the raw body as text for HMAC validation
  const rawBody = await request.text();

  // 2. Validate the webhook using the core library
  const { valid } = await shopify.webhooks.validate({
    rawBody,
    rawRequest: request,
  });

  if (!valid) {
    console.error("Invalid webhook signature received");
    return new Response("Unauthorized", { status: 401 });
  }

  // 3. Parse the payload and extract shop and current scopes
  const payload = JSON.parse(rawBody);
  const shop = payload.shop as string;
  const current = payload.current as string[];

  // 4. Find the offline session for this shop manually
  // Managed authenticate.webhook used to do this for you; 
  // now we query by the validated shop domain.
  const session = await db.session.findFirst({ 
    where: { 
      shop,
      isOnline: false // Webhooks typically target offline sessions
    } 
  });

  if (session) {
    await db.session.update({   
      where: {
        id: session.id
      },
      data: {
        scope: current.toString(),
      },
    });
    console.log(`Updated scopes for ${shop} in database`);
  } else {
    console.warn(`No session found to update scopes for ${shop}`);
  }

  return new Response();
};