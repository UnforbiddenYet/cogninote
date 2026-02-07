export interface Note {
  id: string
  title: string
  preview: string
  connections: number
  folderId?: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  noteCount: number
  color?: string
}

export const mockFolders: Folder[] = [
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Notes about artificial intelligence and ML concepts',
    noteCount: 3,
    color: 'hsl(220, 90%, 56%)',
  },
  {
    id: 'pkm',
    name: 'Personal Knowledge Management',
    description: 'Building a second brain and note-taking systems',
    noteCount: 4,
    color: 'hsl(142, 71%, 45%)',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Workflows and productivity techniques',
    noteCount: 2,
    color: 'hsl(280, 65%, 60%)',
  },
]

export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Getting Started with AI',
    preview: 'Understanding the fundamentals of artificial intelligence and machine learning...',
    connections: 0,
    folderId: 'ai-ml',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-01T14:22:00Z',
  },
  {
    id: '2',
    title: 'Knowledge Graphs Explained',
    preview: 'A comprehensive guide to building and maintaining knowledge graphs...',
    connections: 8,
    folderId: 'pkm',
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-01-28T16:45:00Z',
  },
  {
    id: '3',
    title: 'Second Brain Methodology',
    preview: 'Building a personal knowledge management system that works...',
    connections: 15,
    folderId: 'pkm',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-02-05T11:30:00Z',
  },
  {
    id: '4',
    title: 'Note-taking Best Practices',
    preview: 'Proven strategies for effective note-taking and information retention...',
    connections: 6,
    folderId: 'pkm',
    createdAt: '2024-01-25T13:20:00Z',
    updatedAt: '2024-01-30T09:10:00Z',
  },
  {
    id: '5',
    title: 'Linking Your Thoughts',
    preview: 'The power of bidirectional links in personal knowledge management...',
    connections: 10,
    folderId: 'pkm',
    createdAt: '2024-02-01T15:45:00Z',
    updatedAt: '2024-02-03T10:20:00Z',
  },
  {
    id: '6',
    title: 'Machine Learning Basics',
    preview: 'Core concepts and algorithms in machine learning...',
    connections: 7,
    folderId: 'ai-ml',
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-29T14:15:00Z',
  },
  {
    id: '7',
    title: 'Neural Networks Deep Dive',
    preview: 'Understanding neural network architectures and training...',
    connections: 9,
    folderId: 'ai-ml',
    createdAt: '2024-01-22T16:30:00Z',
    updatedAt: '2024-02-02T08:50:00Z',
  },
  {
    id: '8',
    title: 'Time Management Systems',
    preview: 'Effective time management and scheduling strategies...',
    connections: 5,
    folderId: 'productivity',
    createdAt: '2024-01-28T10:10:00Z',
    updatedAt: '2024-02-04T13:40:00Z',
  },
  {
    id: '9',
    title: 'Deep Work Principles',
    preview: 'Achieving focused work and minimizing distractions...',
    connections: 8,
    folderId: 'productivity',
    createdAt: '2024-02-02T09:25:00Z',
    updatedAt: '2024-02-06T15:30:00Z',
  },
]

export const mockGraphData = {
  nodes: [
    { id: '1', name: 'Getting Started with AI', val: 12 },
    { id: '2', name: 'Knowledge Graphs Explained', val: 8 },
    { id: '3', name: 'Second Brain Methodology', val: 15 },
    { id: '4', name: 'Note-taking Best Practices', val: 6 },
    { id: '5', name: 'Linking Your Thoughts', val: 10 },
    { id: '6', name: 'Machine Learning Basics', val: 7 },
    { id: '7', name: 'Neural Networks', val: 9 },
    { id: '8', name: 'PKM Systems', val: 11 },
  ],
  links: [
    { source: '1', target: '6' },
    { source: '1', target: '7' },
    { source: '2', target: '3' },
    { source: '2', target: '8' },
    { source: '3', target: '4' },
    { source: '3', target: '5' },
    { source: '4', target: '5' },
    { source: '6', target: '7' },
    { source: '8', target: '5' },
  ],
}

export function searchNotes(query: string): Note[] {
  if (!query.trim()) return []

  const lowerQuery = query.toLowerCase()
  return mockNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.preview.toLowerCase().includes(lowerQuery)
  )
}
