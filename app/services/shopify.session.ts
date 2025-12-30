import { Session } from '@shopify/shopify-api';

export function makeSessionFromDb(dbSession: any): Session {
  return new Session({
    id: dbSession.id,
    shop: dbSession.shop,
    state: dbSession.state,
    isOnline: dbSession.isOnline,
    accessToken: dbSession.accessToken,

    // Optional / nullable fields – map null -> undefined
    scope: dbSession.scope ?? undefined,
    expires: dbSession.expires ?? undefined,

    userId: dbSession.userId ?? undefined,
    firstName: dbSession.firstName ?? undefined,
    lastName: dbSession.lastName ?? undefined,
    email: dbSession.email ?? undefined,
    locale: dbSession.locale ?? undefined,
    accountOwner: dbSession.accountOwner,
    collaborator: dbSession.collaborator,
    refreshToken: dbSession.refreshToken ?? undefined,
    refreshTokenExpires: dbSession.refreshTokenExpires ?? undefined,
  });
}
