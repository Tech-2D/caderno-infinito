import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { filterNotes, type Note } from './notes'

const base = { className: '2º D', authorUid: 'u1', authorEmail: 'aluno@exemplo.com', createdAt: null }
const notes: Note[] = [
  { ...base, id: 'a', title: 'Equações', content: 'Funções do segundo grau', subject: 'Matemática', updatedAt: Timestamp.fromMillis(100) },
  { ...base, id: 'b', title: 'Revolução', content: 'Revisão de história', subject: 'História', updatedAt: Timestamp.fromMillis(200) },
]

describe('busca do caderno', () => {
  it('encontra palavras ignorando acentos e ordena pelas atualizações', () => {
    expect(filterNotes(notes, 'Todas', '').map((note) => note.id)).toEqual(['b', 'a'])
    expect(filterNotes(notes, 'Todas', 'equacoes').map((note) => note.id)).toEqual(['a'])
  })

  it('filtra por matéria e pelo conteúdo', () => {
    expect(filterNotes(notes, 'Matemática', 'funcoes').map((note) => note.id)).toEqual(['a'])
    expect(filterNotes(notes, 'História', 'funcoes')).toEqual([])
  })
})
