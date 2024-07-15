import type { SortBy } from '@/types/filter_sortby';
import type { Tag } from '@/types/tags';

import { create } from 'zustand';

interface ShareMessageFilterState {
  selectedTags: Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tagId: number) => void;
  resetTags: () => void;
  isNoTagsSelected: () => boolean;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  resetSortBy: () => void;
  isNotSortByDefault: () => boolean;
  itemPerPage: string;
  setItemPerPage: (itemPerPage: string) => void;
}

const useShareMessageFilterStore = create<ShareMessageFilterState>(
  (set, get) => ({
    selectedTags: [] as Tag[],
    addTag: (tag: Tag) =>
      set((state) => ({ selectedTags: [...state.selectedTags, tag] })),
    removeTag: (tagId: number) =>
      set((state) => ({
        selectedTags: state.selectedTags.filter((tag) => tag.id !== tagId),
      })),
    resetTags: () => set({ selectedTags: [] }),
    isNoTagsSelected: () => get().selectedTags.length === 0,
    sortBy: {
      sortKey: 'created_at',
      sortOrder: 'desc',
    },
    setSortBy: (sortBy: SortBy) => set({ sortBy }),
    resetSortBy: () =>
      set({ sortBy: { sortKey: 'created_at', sortOrder: 'desc' } }),
    isNotSortByDefault: () => {
      const { sortBy } = get();
      return sortBy.sortKey !== 'created_at' || sortBy.sortOrder !== 'desc';
    },
    itemPerPage: '20',
    setItemPerPage: (itemPerPage: string) => set({ itemPerPage }),
  }),
);

export default useShareMessageFilterStore;
