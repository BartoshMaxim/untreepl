import prisma from "~/db.server";

const afterAuthJobs = async (shop: string) => {

    const sessionDb = await prisma.session.findFirst({ where: { shop } });
    console.log("[auth.callback] Session found:", sessionDb ? "yes" : "no");

    if (!sessionDb) {
      console.error("[auth.callback] Session not found for shop:", shop);
      throw new Error("Session not found after auth callback for shop " + shop);
    }

    const existingJob = await prisma.job.findFirst({ where: { shop} });

    if(existingJob){
        return;
    }

    try {
      console.log('[auth.callback] afterAuth hook started for shop:', shop);
      
      const base = process.env.SHOPIFY_APP_URL || 'http://localhost:3000';
      console.log('[auth.callback] afterAuth hook - Base URL:', base);

      const triggerSync = (jobType: string) => {
      const u = new URL('/api/sync', base);
      u.searchParams.set('shop', shop);
      u.searchParams.set('jobType', jobType);
          
      console.log(`[auth.callback] Triggering ${jobType} sync:`, u.toString());
          
      // Changed to GET (default) and keeping query params
      return fetch(u.toString()).catch((err) => 
        console.error(`[auth.callback] afterAuth sync trigger failed (${jobType.toLowerCase()})`, err)
       );
      };

        // Fire both syncs
      await Promise.all(['ORDERS', 'PRODUCTS', 'FULFILLMENT_SERVICE'].map(triggerSync));
      
    } catch (e: any) {
      console.error('[auth.callback] afterAuth sync trigger failed', e);
      console.error('[auth.callback] Error stack:', e.stack);
    } finally {
      console.log('[auth.callback] afterAuth hook completed');
    }
};

export default afterAuthJobs;