import { Link } from '@tanstack/react-router'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useIslandStore } from '../lib/store'
import { BacklinkCard } from './backlink-card'
import { useSearchQuery } from '../hooks/useSearch'

function ReadonlyMarkdown({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ html: true }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none text-foreground/90',
      },
    },
  }, [content])

  return <EditorContent editor={editor} />
}

export function AIInsightPanel() {
  const { submittedQuery } = useIslandStore()
  const { data, isLoading, error } = useSearchQuery({ query: submittedQuery });

  if (!submittedQuery) return (
    <div className="p-12 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
      <div className="text-center">
        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ask Your Second Brain
        </h3>
        <p className="text-sm text-muted-foreground">
          Use the AI search above to query your knowledge base
        </p>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Error State */}
      {error && (
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {error instanceof Error ? error.message : 'Failed to process query'}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column - AI Answer */}
        <div className="lg:col-span-2 space-y-5">
          {/* AI Synthesized Answer */}
          <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Answer</h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-4/6" />
                </div>
              ) : data?.answer ? (
                <ReadonlyMarkdown content={data.answer} />
              ) : !error ? (
                <p className="text-sm text-muted-foreground">
                  Processing your query...
                </p>
              ) : null}
            </div>
          </div>

          {/* Source Documents */}
          {data?.sources && data.sources.length > 0 ? (
            <div className="p-6 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Source Documents ({data?.sources.length ?? 0})
                </h3>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {data.sources.map((source) => (
                  <Link
                    key={source.noteId}
                    to="/app/notes/$noteId"
                    params={{ noteId: source.noteId }}
                    className="block"
                  >
                    <BacklinkCard
                      title={source.title}
                      content={source.summary}
                    />
                  </Link>
                ))}
              </div>
            </div>) : null}
        </div>
      </div>
    </div>
  )
}
