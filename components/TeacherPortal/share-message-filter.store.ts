import { Tag } from '@/types/tags';

import { create } from 'zustand';

interface ShareMessageFilterState {
  selectedTags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagId: number) => void;
  resetTags: () => void;
}

const useShareMessageFilterStore = create<ShareMessageFilterState>((set) => ({
  selectedTags: [] as Tag[],
  addTag: (tag: Tag) =>
    set((state) => ({ selectedTags: [...state.selectedTags, tag] })),
  removeTag: (tagId: number) =>
    set((state) => ({
      selectedTags: state.selectedTags.filter((tag) => tag.id !== tagId),
    })),
  resetTags: () => set({ selectedTags: [] }),
}));

export default useShareMessageFilterStore;
