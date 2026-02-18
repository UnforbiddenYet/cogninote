import { create } from "zustand";

interface IslandStore {
  query: string;
  submittedQuery: string;
  isAIExpanded: boolean;
  setQuery: (query: string) => void;
  submitQuery: () => void;
  submitQueryDirect: (query: string) => void;
  setIsAIExpanded: (expanded: boolean) => void;
  reset: () => void;
}

const initialState = {
  query: "",
  submittedQuery: "",
  isAIExpanded: false,
};

export const useIslandStore = create<IslandStore>((set, get) => ({
  ...initialState,
  setQuery: (query) => set({ query }),
  submitQuery: () => set({ submittedQuery: get().query.trim() }),
  submitQueryDirect: (query) => set({ query, submittedQuery: query.trim() }),
  setIsAIExpanded: (isAIExpanded) => set({ isAIExpanded }),
  reset: () => set({ query: "", submittedQuery: "", isAIExpanded: false }),
}));
