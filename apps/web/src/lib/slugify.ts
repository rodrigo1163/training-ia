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

/** n=1 → base; n=2 → base-2; n=3 → base-3 */
export function withIncrementalSlug(baseSlug: string, n: number): string {
  return n <= 1 ? baseSlug : `${baseSlug}-${n}`
}
