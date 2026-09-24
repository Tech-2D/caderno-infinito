import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const remarkPlugins = [remarkGfm]

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <Markdown
        remarkPlugins={remarkPlugins}
        skipHtml
        components={{
          a: ({ href, title, children }) => <a href={href} title={title} target="_blank" rel="noopener noreferrer">{children}</a>,
          img: ({ src, alt, title }) => <img src={src} alt={alt ?? ''} title={title} loading="lazy" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}

export function MarkdownExcerpt({ content }: { content: string }) {
  return (
    <span className="note-excerpt">
      <Markdown remarkPlugins={remarkPlugins} skipHtml allowedElements={['em', 'strong', 'del', 'code']} unwrapDisallowed>
        {content}
      </Markdown>
    </span>
  )
}
