'use client';

import { usePathname } from 'next/navigation';
import Nav from '@/components/Nav';

const PUBLIC_PATHS = ['/', '/auth'];

export default function NavWrapper() {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isPublic) return null;
  return <Nav />;
}
