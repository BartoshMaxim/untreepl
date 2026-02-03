import "@shopify/shopify-api/adapters/web-api";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

console.log("Initializing Shopify App with API Key:", process.env.SHOPIFY_API_KEY);

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY?.trim() || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET?.trim() || "",
  apiVersion: ApiVersion.January26,
  scopes: process.env.SCOPES?.split(","),
  hostName: process.env.SHOPIFY_APP_URL?.replace(/https?:\/\//, "") || "",
  isEmbeddedApp: false,
  sessionStorage: new PrismaSessionStorage(prisma),
}
 );

export default shopify;
export const apiVersion = ApiVersion.January26;

