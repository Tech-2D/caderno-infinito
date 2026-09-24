import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarkdownContent, MarkdownExcerpt } from './MarkdownContent'

describe('anotações em Markdown', () => {
  it('formata títulos, negrito, listas e tabelas', () => {
    const html = renderToStaticMarkup(<MarkdownContent content={'## Resumo\n\n**Importante**\n\n- primeiro\n- segundo\n\n| A | B |\n| - | - |\n| 1 | 2 |'} />)
    expect(html).toContain('<h2>Resumo</h2>')
    expect(html).toContain('<strong>Importante</strong>')
    expect(html).toContain('<li>primeiro</li>')
    expect(html).toContain('<table>')
  })

  it('não executa HTML nem aceita links com javascript', () => {
    const html = renderToStaticMarkup(<MarkdownContent content={'<script>alert(1)</script>\n\n[clique](javascript:alert(1))'} />)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('href="javascript:')
  })

  it('mostra apenas conteúdo inline nos cartões', () => {
    const html = renderToStaticMarkup(<MarkdownExcerpt content={'# Título\n\n**Texto** com [link](https://example.com)'} />)
    expect(html).toContain('<strong>Texto</strong>')
    expect(html).not.toContain('<h1>')
    expect(html).not.toContain('<a ')
  })
})
