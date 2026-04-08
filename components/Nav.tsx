'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navLinks = [
  { href: '/matrix', label: 'Matrix' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900 mr-4 hidden sm:block">Covey</span>
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`
                  inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3
                  text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3
            text-sm font-medium text-gray-600 rounded-md transition-colors
            hover:text-gray-900 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
