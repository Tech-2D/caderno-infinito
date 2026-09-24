import type { Timestamp } from 'firebase/firestore'

export const SUBJECTS = [
  'Matemática',
  'Português',
  'Ciências',
  'História',
  'Geografia',
  'Tecnologia',
  'Outras',
] as const

export type Subject = (typeof SUBJECTS)[number]
export type SubjectFilter = Subject | 'Todas'

export type Note = {
  id: string
  title: string
  content: string
  subject: Subject
  className: string
  authorUid: string
  authorEmail: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function filterNotes(notes: Note[], subject: SubjectFilter, search: string): Note[] {
  const term = normalize(search.trim())
  return notes
    .filter((note) => subject === 'Todas' || note.subject === subject)
    .filter((note) => !term || normalize([note.title, note.content, note.subject, note.className, note.authorEmail].join(' ')).includes(term))
    .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0))
}

export function noteDate(value: Timestamp | null): string {
  if (!value) return 'Agora mesmo'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(value.toDate())
}
