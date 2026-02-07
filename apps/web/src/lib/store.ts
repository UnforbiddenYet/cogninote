import { create } from 'zustand'
import type { Note } from './mock-data'

interface IslandStore {
  query: string
  searchResults: Note[]
  isAIExpanded: boolean
  setQuery: (query: string) => void
  setSearchResults: (results: Note[]) => void
  setIsAIExpanded: (expanded: boolean) => void
  reset: () => void
}

export const useIslandStore = create<IslandStore>((set) => ({
  query: '',
  searchResults: [],
  isAIExpanded: false,
  setQuery: (query) => set({ query }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsAIExpanded: (isAIExpanded) => set({ isAIExpanded }),
  reset: () => set({ query: '', searchResults: [], isAIExpanded: false }),
}))
