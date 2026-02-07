import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeGraph } from '../components/knowledge-graph'

export const Route = createFileRoute('/app/graph')({
  component: GraphPage,
})

function GraphPage() {
  return <KnowledgeGraph />
}
