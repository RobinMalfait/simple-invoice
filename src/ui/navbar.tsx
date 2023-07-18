'use client'

import { CubeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  if (usePathname()?.includes('/raw')) {
    return null
  }

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-br from-black/90 to-gray-950/75 backdrop-blur print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-lg text-white">
          <CubeIcon className="h-6 w-6 text-gray-200" /> Simple Invoice.
        </Link>
      </div>
    </div>
  )
}
