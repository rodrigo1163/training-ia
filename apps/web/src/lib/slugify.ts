export function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'org'
}

export function withSlugSuffix(baseSlug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${baseSlug}-${suffix}`
}
