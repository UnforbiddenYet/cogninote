'use client'

import { FileText, Link2 } from 'lucide-react'
import { Note } from '../lib/mock-data'

interface BacklinkCardProps {
  note: Note
  index: number
}

export function BacklinkCard({ note }: BacklinkCardProps) {
  return (
    <div className="group relative p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-border transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm mb-1 truncate">
            {note.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {note.preview}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3" />
            <span>{note.connections} connections</span>
          </div>
        </div>
      </div>
    </div>
  )
}
