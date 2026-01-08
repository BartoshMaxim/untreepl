export async function action({ request }: any) {
  console.log("webhooks/fulfillment/fulfillment_order_notification POST called");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  
  try {
    const body = await request.text();
    console.log("Request body:", body);
  } catch (error) {
    console.error("Error reading request body:", error);
  }
  
  return new Response(null, { status: 204 });
}