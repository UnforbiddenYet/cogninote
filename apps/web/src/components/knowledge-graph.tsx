import { useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
// import { useRouter } from 'next/navigation'
import { mockGraphData } from '../lib/mock-data'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  name: string
  val: number
}

export function KnowledgeGraph() {
  // const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Initialize nodes with random positions
    const initialNodes: Node[] = mockGraphData.nodes.map((node) => ({
      ...node,
      x: Math.random() * 800 + 100,
      y: Math.random() * 400 + 100,
      vx: 0,
      vy: 0,
    }))
    nodesRef.current = initialNodes

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply forces
      const updatedNodes = nodesRef.current.map((node) => {
        let fx = 0
        let fy = 0

        // Center attraction
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        fx += (centerX - node.x) * 0.001
        fy += (centerY - node.y) * 0.001

        // Repulsion from other nodes
        nodesRef.current.forEach((other) => {
          if (other.id !== node.id) {
            const dx = node.x - other.x
            const dy = node.y - other.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = 100 / (distance * distance)
            fx += (dx / distance) * force
            fy += (dy / distance) * force
          }
        })

        // Update velocity and position
        const newVx = (node.vx + fx) * 0.9
        const newVy = (node.vy + fy) * 0.9
        return {
          ...node,
          vx: newVx,
          vy: newVy,
          x: node.x + newVx,
          y: node.y + newVy,
        }
      })

      nodesRef.current = updatedNodes

      // Draw links
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)'
      ctx.lineWidth = 1
      mockGraphData.links.forEach((link) => {
        const source = updatedNodes.find((n) => n.id === link.source)
        const target = updatedNodes.find((n) => n.id === link.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      updatedNodes.forEach((node) => {
        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI)
        ctx.fillStyle = 'hsl(240, 5%, 15%)'
        ctx.fill()
        ctx.strokeStyle = 'hsl(240, 5%, 35%)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Node label
        ctx.fillStyle = 'hsl(0, 0%, 98%)'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.name.slice(0, 20), node.x, node.y + node.val + 12)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl">
      <div className="absolute inset-0 flex items-center justify-center p-8">
        {/* Controls */}
        <div className="absolute top-8 right-8 flex items-center gap-2">
          <button
            type="button"
            className="p-3 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-card transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            className="p-3 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-card transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            className="p-3 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-card transition-colors"
            aria-label="Fit to screen"
          >
            <Maximize2 className="h-4 w-4 text-foreground" />
          </button>
          <div className="w-px h-8 bg-border mx-1" />
          <button
            type="button"
            // onClick={() => router.push('/')}
            className="p-3 rounded-xl bg-card/50 backdrop-blur border border-border/50 hover:bg-card transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Graph Canvas */}
        <div className="w-full max-w-5xl h-full max-h-[600px] rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
