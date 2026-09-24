import { describe, expect, it } from 'vitest'
import { releaseTitle, unseenReleases, type ReleaseEntry } from './releaseNotes'

const history: ReleaseEntry[] = [
  { sha: 'c', subject: 'feat: adicionar novidades' },
  { sha: 'b', subject: 'fix: corrigir busca' },
  { sha: 'a', subject: 'feat: criar filtros' },
]

describe('aviso de atualizações', () => {
  it('mostra só a versão atual para quem entra pela primeira vez', () => {
    expect(unseenReleases(history, null)).toEqual([history[0]])
  })

  it('reúne as alterações posteriores à última versão vista', () => {
    expect(unseenReleases(history, 'a')).toEqual([history[0], history[1]])
    expect(unseenReleases(history, 'c')).toEqual([])
  })

  it('resume as últimas versões se a anterior saiu do histórico', () => {
    expect(unseenReleases(history, 'antiga')).toEqual(history)
  })

  it('transforma o título do commit em texto legível', () => {
    expect(releaseTitle('feat(caderno): adicionar favoritos')).toBe('Adicionar favoritos')
    expect(releaseTitle('fix: corrigir busca')).toBe('Corrigir busca')
  })
})
