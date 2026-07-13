import React from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-button active:bg-primary-dark',
  secondary: 'bg-white text-ink shadow-soft ring-1 ring-black/5',
  ghost: 'bg-transparent text-ink active:bg-black/5',
  danger: 'bg-rose-600 text-white shadow-button active:bg-rose-700'
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
  icon: 'h-12 w-12 p-0'
}

export default function Button({ className, variant = 'primary', size = 'md', asChild, children, ...props }: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(classes, children.props.className)
    })
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}
