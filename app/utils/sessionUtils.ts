import { Session } from "@shopify/shopify-api";
import prisma from "~/db.server";

const sessionUpsert = async (session: Session) => {
  await prisma.session.upsert({
    where: { id: session.id || "" },
    update: {
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope || null,
      expires: session.expires || null,
      accessToken: session.accessToken || "",
    },
    create: {
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope || null,
      expires: session.expires || null,
      accessToken: session.accessToken || "",
    },
  });

  return true;
};

export default sessionUpsert;