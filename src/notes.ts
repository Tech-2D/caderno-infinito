import type { Timestamp } from 'firebase/firestore'

// Matérias distintas dos horários em schedules (Firebase d-tech-56a76), consultadas em 24/09/2026.
// Preserve os nomes usados pela escola para que as anotações possam ser classificadas sem perda.
export const SUBJECTS = [
  'Arte-Arquitetura de Sistemas',
  'Arte-Big Data',
  'Arte-Chefia e Liderança',
  'Arte-Marketing',
  'Atividades de Estudo-TCC',
  'Biologia',
  'Biologia 2 - ESG',
  'Ciência de Dados',
  'Ciências',
  'Desafios Reais de Negócio',
  'Desenvolvimento',
  'Desenvolvimento de Aplicação Dinâmica',
  'Desenvolvimento de Aplicativo Móvel',
  'Desenvolvimento e Operações Ágeis',
  'Educação Financeira',
  'Educação Física',
  'Engenharia e Qualidae de Software',
  'Estatística',
  'Estatística 1-Business Intelligence',
  'Filosofia',
  'Física',
  'Gameficação Para Aulas Práticas',
  'Geografia',
  'Gestão de Processo e Exelência',
  'Gestão de Varejo',
  'História',
  'História 2-Gestão de Varejo',
  'Lingua inglesa',
  'Lingua Inglêsa',
  'Língua Portuguesa',
  'Lingua Portuguêsa 2',
  'Língua Portuguesa 2 - Chefia e Liderança',
  'Língua Portuguêsa 2- Linguagens Redes Sociais',
  'Língua Portuguesa 2-Chefia e Liderança',
  'Língua Portuguesa e Suas Literaturas',
  'Matemática',
  'Matemática 10-Modelagem de Dados',
  'Matemática 12-Inovação e Tecnologia',
  'Matemática 13-Programação Orientada a Objetos',
  'Matemática 14-Inteligência Artificial',
  'Matemática 15-Séries Temporais',
  'Matemática 2',
  'Matemática 2-Logica de Programação',
  'Matematica 4-Crédito',
  'Matemática 5-Economia e Matemática Financeira',
  'Matemática 7-Contabilidade Fiscal',
  'Matemática 8-Análise de Dados',
  'Matemática 9-Banco de dados',
  'Metodologia de Projetos de Desenvolvimento de TI',
  'Orientação de Estudos',
  'Produtos Digitais',
  'Programaçâo Assíncrona',
  'Projeto de Conclusão',
  'Química',
  'Redes Sociais',
  'Segurança Cibernética',
  'Sistemas Operacionais',
  'Sociologia',
  'Técnicas de Persuasão',
  'tecnologia digitais',
  'tecnologia digitais 1',
  'Tecnologias digitais',
  'UX',
  'Outras',
] as const

export type Subject = string
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

export function matchesSubjectName(subject: string, search: string): boolean {
  return normalize(subject).includes(normalize(search.trim()))
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
