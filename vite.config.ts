import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'

function releaseHistory() {
  try {
    const output = execFileSync('git', ['log', '-30', '--no-merges', '--format=%H%x1f%s%x1e'], { encoding: 'utf8' })
    return output.split('\x1e').map((entry) => {
      const [sha, subject] = entry.trim().split('\x1f')
      return { sha, subject }
    }).filter((entry) => /^[0-9a-f]{40}$/.test(entry.sha) && entry.subject)
  } catch {
    return []
  }
}

export default defineConfig({
  plugins: [react()],
  base: './',
  define: { __APP_RELEASE_HISTORY__: JSON.stringify(releaseHistory()) },
})
