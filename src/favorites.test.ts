import { describe, expect, it } from 'vitest'
import { filterFavoriteNotes, parseFavoriteIds, toggleFavoriteId } from './favorites'
import type { Note } from './notes'

describe('favoritos do caderno', () => {
  it('lê somente IDs válidos e sem repetição', () => {
    expect(parseFavoriteIds('["a","a",12,"b",""]')).toEqual(['a', 'b'])
    expect(parseFavoriteIds('valor inválido')).toEqual([])
    expect(parseFavoriteIds(null)).toEqual([])
  })

  it('marca e desmarca uma anotação', () => {
    expect(toggleFavoriteId(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleFavoriteId(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('mostra somente anotações favoritas na ordem recebida', () => {
    const notes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as Note[]
    expect(filterFavoriteNotes(notes, ['c', 'a']).map((note) => note.id)).toEqual(['a', 'c'])
  })
})
