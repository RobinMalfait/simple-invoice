'use client'

import { ComponentProps } from 'react'

export function RecipientCheckbox(props: ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      onChange={(e) => {
        return e.target.closest('form')?.requestSubmit()
      }}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-900 dark:bg-zinc-700 dark:focus:ring-offset-zinc-900"
      {...props}
    />
  )
}
