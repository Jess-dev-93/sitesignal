export function getDisplayName(name?: string | null, email?: string | null): string {
  const trimmed = name?.trim()
  if (trimmed) return trimmed.split(' ')[0]

  const local = email?.split('@')[0]?.trim()
  if (local) return local.charAt(0).toUpperCase() + local.slice(1)

  return 'there'
}

export function getInitials(name?: string | null, email?: string | null): string {
  const trimmed = name?.trim()
  if (trimmed) {
    return trimmed
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  if (email) return email.slice(0, 2).toUpperCase()
  return 'SS'
}
