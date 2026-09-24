export type ReleaseEntry = { sha: string; subject: string }

export const SEEN_RELEASE_KEY = 'caderno-infinito:last-seen-release:v1'

export function unseenReleases(history: ReleaseEntry[], lastSeenSha: string | null): ReleaseEntry[] {
  if (!history.length || history[0].sha === lastSeenSha) return []
  if (!lastSeenSha) return history.slice(0, 1)

  const lastSeenIndex = history.findIndex((entry) => entry.sha === lastSeenSha)
  return lastSeenIndex < 0 ? history.slice(0, 5) : history.slice(0, lastSeenIndex)
}

export function releaseTitle(subject: string): string {
  const title = subject.replace(/^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([^)]+\))?!?:\s*/i, '').trim()
  return title ? title[0].toLocaleUpperCase('pt-BR') + title.slice(1) : 'Atualização do caderno'
}
