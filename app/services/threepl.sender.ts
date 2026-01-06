export async function sendTo3PLBatch(type: "orders" | "products", payload: any, idempotencyKey: string) {
  const url = process.env.THREEPL_API_URL || "https://webhook.site/testshopify";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({ type, payload })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`3PL POST failed: ${res.status} ${text}`);
  }
  return res.json();
}
