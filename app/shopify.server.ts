import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

console.log("Initializing Shopify App with API Key:", process.env.SHOPIFY_API_KEY);

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY?.trim() || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET?.trim() || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL?.trim() || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: false,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  // Trigger our initial sync after a fresh install via afterAuth hook
  hooks:{
  afterAuth: async ({ session, admin }: any) => {
    try {

      console.log('afterAuth hook started for shop:', session.shop);
      const shop = session?.shop;
      if (!shop) return;

      const base = process.env.SHOPIFY_APP_URL || 'http://localhost:3000';

      console.log('afterAuth hook - Base URL:', base);

      const triggerSync = (jobType: string) => {
        const u = new URL('/api/sync', base);
        u.searchParams.set('shop', shop);
        u.searchParams.set('jobType', jobType);
        
        // Changed to GET (default) and keeping query params
        fetch(u.toString()).catch((err) => 
          console.error(`afterAuth sync trigger failed (${jobType.toLowerCase()})`, err)
        );
      };

      // Fire both syncs
      ['ORDERS', 'PRODUCTS', 'FULFILLMENT_SERVICE'].forEach(triggerSync);


    } catch (e: any) {
      console.error('afterAuth sync trigger failed', e);
    }
    finally{
      console.log('afterAuth hook completed');
    }
  },
}});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
