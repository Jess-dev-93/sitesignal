'use client'

import * as React from 'react'

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ')
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  size?: 'sm' | 'md'
  variant?: 'default' | 'secondary' | 'outline'
}

export function Button({
  asChild,
  size = 'md',
  variant = 'default',
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
  const sizes = {
    sm: 'h-9 px-3',
    md: 'h-10 px-4',
  }[size]
  const variants = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent text-foreground hover:bg-secondary/40',
  }[variant]

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>
    return React.cloneElement(child, {
      ...(child.props as any),
      className: cx(base, sizes, variants, child.props?.className, className),
    } as any)
  }

  return (
    <button className={cx(base, sizes, variants, className)} {...props}>
      {children}
    </button>
  )
}

