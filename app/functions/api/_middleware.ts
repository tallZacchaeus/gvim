import { requireAdmin, bad, Env } from '../lib/util';

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const protectedPaths = [
    '/api/auth/me',
    '/api/contacts',
    '/api/upload'
  ];
  const isWriteApi = url.pathname.startsWith('/api/') &&
    ['POST','PUT','PATCH','DELETE'].includes(ctx.request.method) &&
    !url.pathname.startsWith('/api/auth/login') &&
    !url.pathname.startsWith('/api/contact');

  const needsAuth = protectedPaths.some(p => url.pathname.startsWith(p)) || isWriteApi;
  if (needsAuth) {
    const user = await requireAdmin(ctx.request, ctx.env);
    if (!user) return bad('Unauthorized', 401);
    (ctx as any).data = { user };
  }
  return ctx.next();
};
