import { SortBy } from '@/types/filter_sortby';
import { Tag } from '@/types/tags';

import { create } from 'zustand';

interface ShareMessageFilterState {
  selectedTags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagId: number) => void;
  resetTags: () => void;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
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
  sortBy: {
    sortKey: 'created_at',
    sortOrder: 'desc',
  },
  setSortBy: (sortBy: SortBy) => set({ sortBy }),
}));

export default useShareMessageFilterStore;
