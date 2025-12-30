import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  // Trigger our initial sync after a fresh install via afterAuth hook
  afterAuth: async ({ session, isNew }: any) => {
    try {

      console.log('afterAuth hook - isNew:', isNew);
      if (!isNew) return;
      const shop = session?.shop;
      if (!shop) return;

      const base = process.env.SHOPIFY_APP_URL || 'http://localhost:3000';

      console.log('afterAuth hook - Base URL:', base);

      const triggerSync = (jobType: string) => {
        const u = new URL('/api/sync', base);
        u.searchParams.set('shop', shop);
        u.searchParams.set('jobType', jobType);
        fetch(u.toString(), { method: 'POST' }).catch((err) => console.error(`afterAuth sync trigger failed (${jobType.toLowerCase()})`, err));
      };

      // Fire both syncs without blocking install flow
      ['ORDERS', 'PRODUCTS'].forEach(triggerSync);


    } catch (e: any) {
      console.error('afterAuth sync trigger failed', e);
    }
  },
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
