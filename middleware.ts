import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(',');
  const origin = request.headers.get('origin');
  
  const response = NextResponse.next();
  
  // CORS Check for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  // General Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
