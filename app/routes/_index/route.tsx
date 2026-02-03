// app/routes/_index/route.tsx
import { type LoaderFunctionArgs, redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // 1. If we have a shop param, start the auth flow immediately
  if (shop) {
    throw redirect(`/auth/login?${url.searchParams.toString()}`);
  }

  // 2. Otherwise, show a landing page
  return null;
};

export default function LandingPage() {
  return <div>Welcome to Untreepl. Please install via Shopify.</div>;
}