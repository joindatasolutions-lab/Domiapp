import React from 'react'
import { cn } from '../../lib/utils'

export default function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5', className)}
      {...props}
    />
  )
}
