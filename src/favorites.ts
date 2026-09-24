import type { Note } from './notes'

export const FAVORITES_STORAGE_KEY = 'caderno-infinito:favorites:v1'

export function parseFavoriteIds(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))]
      : []
  } catch {
    return []
  }
}

export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

export function filterFavoriteNotes(notes: Note[], ids: string[]): Note[] {
  const favorites = new Set(ids)
  return notes.filter((note) => favorites.has(note.id))
}
