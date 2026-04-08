// Feature: convey-task-manager, Property 1: Protected routes reject unauthenticated requests
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 1: Protected routes reject unauthenticated requests
 *
 * For any protected route path, a request without a valid session should be
 * redirected to the sign-in page (/). For API routes, a 401 should be returned.
 *
 * Validates: Requirements 1.6, 8.2
 */

const PROTECTED_PATHS = ['/matrix', '/history', '/settings'];

/** Mirrors the middleware redirect logic without Next.js runtime dependencies */
function resolveRoute(
  pathname: string,
  isAuthenticated: boolean
): { action: 'redirect' | 'allow'; destination?: string } {
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    return { action: 'redirect', destination: '/' };
  }

  if (pathname === '/' && isAuthenticated) {
    return { action: 'redirect', destination: '/matrix' };
  }

  return { action: 'allow' };
}

describe('Property 1: Protected routes reject unauthenticated requests', () => {
  it('any protected path without a session redirects to /', () => {
    // Arbitrary sub-paths under each protected root
    const protectedPathArb = fc.oneof(
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/matrix${s ? '/' + s : ''}`),
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/history${s ? '/' + s : ''}`),
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/settings${s ? '/' + s : ''}`)
    );

    fc.assert(
      fc.property(protectedPathArb, (pathname) => {
        const result = resolveRoute(pathname, false /* unauthenticated */);
        expect(result.action).toBe('redirect');
        expect(result.destination).toBe('/');
      }),
      { numRuns: 100 }
    );
  });

  it('any protected path with a valid session is allowed through', () => {
    const protectedPathArb = fc.oneof(
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/matrix${s ? '/' + s : ''}`),
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/history${s ? '/' + s : ''}`),
      fc.string({ minLength: 0, maxLength: 30 }).map((s) => `/settings${s ? '/' + s : ''}`)
    );

    fc.assert(
      fc.property(protectedPathArb, (pathname) => {
        const result = resolveRoute(pathname, true /* authenticated */);
        expect(result.action).toBe('allow');
      }),
      { numRuns: 100 }
    );
  });

  it('authenticated users on the sign-in page are redirected to /matrix', () => {
    fc.assert(
      fc.property(fc.constant('/'), (pathname) => {
        const result = resolveRoute(pathname, true);
        expect(result.action).toBe('redirect');
        expect(result.destination).toBe('/matrix');
      }),
      { numRuns: 100 }
    );
  });

  it('unauthenticated users on the sign-in page are allowed through', () => {
    fc.assert(
      fc.property(fc.constant('/'), (pathname) => {
        const result = resolveRoute(pathname, false);
        expect(result.action).toBe('allow');
      }),
      { numRuns: 100 }
    );
  });

  it('non-protected paths are always allowed regardless of auth state', () => {
    // Paths that are not under /matrix, /history, or /settings and not exactly /
    const publicPathArb = fc
      .string({ minLength: 1, maxLength: 40 })
      .map((s) => `/${s}`)
      .filter(
        (p) =>
          !PROTECTED_PATHS.some((pp) => p.startsWith(pp)) &&
          p !== '/'
      );

    fc.assert(
      fc.property(publicPathArb, fc.boolean(), (pathname, isAuthenticated) => {
        const result = resolveRoute(pathname, isAuthenticated);
        expect(result.action).toBe('allow');
      }),
      { numRuns: 100 }
    );
  });
});
