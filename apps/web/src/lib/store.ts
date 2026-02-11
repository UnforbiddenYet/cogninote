import { create } from 'zustand'

interface IslandStore {
  query: string
  submittedQuery: string
  isAIExpanded: boolean
  setQuery: (query: string) => void
  submitQuery: () => void
  setIsAIExpanded: (expanded: boolean) => void
  reset: () => void
}

export const useIslandStore = create<IslandStore>((set, get) => ({
  query: '',
  submittedQuery: '',
  isAIExpanded: false,
  setQuery: (query) => set({ query }),
  submitQuery: () => set({ submittedQuery: get().query.trim() }),
  setIsAIExpanded: (isAIExpanded) => set({ isAIExpanded }),
  reset: () => set({ query: '', submittedQuery: '', isAIExpanded: false }),
}))
