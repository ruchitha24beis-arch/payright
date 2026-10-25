import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow tokenized guest portal routes (public zero-login access)
  if (pathname.startsWith('/portal/')) {
    return NextResponse.next();
  }

  // 2. Allow auth routes, static assets, next internals, and icons
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('chanakya_token')?.value;
  const role = request.cookies.get('chanakya_role')?.value;

  // 3. Buyer AP Portal Protection
  if (pathname.startsWith('/buyer')) {
    if (!token || role !== 'BUYER') {
      const loginUrl = new URL('/login/buyer', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Supplier specific route protection
  if (pathname.startsWith('/supplier')) {
    if (!token || role !== 'SUPPLIER') {
      const loginUrl = new URL('/login/supplier', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Allow standard platform routes (e.g., /dashboard, /reminders, /buyers, /samadhan, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
