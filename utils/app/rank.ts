import dayjs from 'dayjs';

import { RANK_INTERVAL } from './const';
import type { FolderInterface } from '@/types/folder';

// Sorts by ascending rank. Places deleted items at the end of the list.
export const sortByRank = (a: any, b: any): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (a.rank == null || b.rank == null) return 0;
  return a.rank - b.rank;
};

// Sorts collection based on folders. Effectively groups items within
// a collection with other items that belong to the same group/no group.
// Deleted items are placed at the end of the list.
export const sortByFolder = (a: any, b: any): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (!a.folderId && b.folderId) return 1;
  if (a.folderId && !b.folderId) return -1;
  if (!a.folderId && !b.folderId || a.folderId === b.folderId) return 0;
  // How the following comparison is done doesn't matter.
  return a.folderId > b.folderId ? 1 : -1;
};

// Only use for collections where items have folderIds.
export const sortByRankAndFolder = (collection: any[]) => {
  return [...collection].sort(sortByRank).sort(sortByFolder);
};

export const sortByFolderType = (a: FolderInterface, b: FolderInterface) => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  return a.type > b.type ? 1 : -1;
};

export const sortByRankAndFolderType = (folders: FolderInterface[]) => {
  return [...folders].sort(sortByRank).sort(sortByFolderType);
}

// Calculates the new rank of an item given the index of where to move it.
// 'filteredCollection' should be a collection of items sorted by rank with
// a common folderId. 'insertAt' is relative to 'filteredCollection'.
export const generateRank = (filteredCollection: any[], insertAt?: number): number => {
  // Set the default insertAt value to the length of the filtered items
  if (
    insertAt == null ||
    insertAt < 0 ||
    insertAt > filteredCollection.length
  ) {
    insertAt = filteredCollection.length;
  }

  // Inserting an item at the beginning
  if (insertAt === 0) {
    const bottomItem = filteredCollection[insertAt];
    if (!bottomItem || !bottomItem.rank) return RANK_INTERVAL;
    return Math.floor(bottomItem.rank / 2);
  }

  // Appending an item to the end
  if (insertAt === filteredCollection.length) {
    const topItem = filteredCollection[insertAt - 1];
    if (!topItem || !topItem.rank)
      return (filteredCollection.length + 1) * RANK_INTERVAL;
    return topItem.rank + RANK_INTERVAL;
  }

  // Inserting an item in the middle
  const topItem = filteredCollection[insertAt - 1];
  const bottomItem = filteredCollection[insertAt];

  if (!topItem.rank && !bottomItem.rank) {
    return Math.floor((filteredCollection.length * RANK_INTERVAL) / 2);
  } else if (!topItem.rank) {
    return Math.floor(bottomItem.rank / 2);
  } else if (!bottomItem.rank) {
    return Math.floor(
      (topItem.rank + filteredCollection.length * RANK_INTERVAL) / 2,
    );
  }

  return Math.floor((topItem.rank + bottomItem.rank) / 2);
};

// For folders only
// The collection has to be sorted by rank and folder type but doesn't need to filtered.
export const areFoldersBalanced = (collection: FolderInterface[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (item1.deleted || item2.deleted) continue;
    if (
      (item1.rank === item2.rank && item1.type === item2.type)
      || item1.rank <= 0
      || item2.rank <= 0
    ) {
      return false;
    }
  }

  return true;
};

// For conversations and prompts
// The collection has to be sorted by rank and folder but doesn't need to filtered.
export const areItemsBalanced = (collection: any[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (item1.deleted || item2.deleted) continue;
    if (
      (item1.rank === item2.rank && item1.folderId === item2.folderId)
      || item1.rank <= 0
      || item2.rank <= 0
    ) {
      return false;
    }
  }
  return true;
};

// Rebalances the ranks of the collection. Requires that the collection is in
// sorted order by ranks and that items with conflicting ranks are adjacent
// to each other.
export const rebalanceFolders = (folders: FolderInterface[]): FolderInterface[] => {
  if (!folders.length) return folders;

  const lastUpdateAtUTC = dayjs().valueOf();
  let currentFolderType = folders[0].type;
  let currentRank = RANK_INTERVAL;

  return folders.map((folder) => {
    if (!folder) return folder;

    // Checking if the current item is part of the same folder type. If not, then
    // reset the current rank counter.
    if (folder.type !== currentFolderType) {
      currentFolderType = folder.type;
      currentRank = RANK_INTERVAL;
    }

    const updatedFolder: FolderInterface = {
      ...folder,
      rank: currentRank,
      lastUpdateAtUTC,
    }

    currentRank += RANK_INTERVAL;

    return updatedFolder;
  });
};

// The collection has to be sorted by rank and folder but doesn't need to filtered.
export const rebalanceItems = (collection: any[]): any[] => {
  if (!collection.length) return collection;

  const lastUpdateAtUTC = dayjs().valueOf();
  let currentFolderId = collection[0].folderId;
  let currentRank = RANK_INTERVAL;

  return collection.map((item) => {
    if (item.deleted) return item;

    // Checking if the current item is part of another sub-collection. If so,
    // reset the current rank counter.
    if (item.folderId !== currentFolderId) {
      currentFolderId = item.folderId;
      currentRank = RANK_INTERVAL;
    }

    const updatedItem: any = {
      ...item,
      rank: currentRank,
      lastUpdateAtUTC,
    };

    currentRank += RANK_INTERVAL;

    return updatedItem;
  });
};

export const reorderFolder = (
  folders: FolderInterface[],
  itemId: string,
  rank: number,
): any[] => {
  let updatedFolders = sortByRankAndFolderType(
    folders.map((folder) => {
      if (folder.id === itemId) {
        return {
          ...folder,
          rank,
          lastUpdateAtUTC: dayjs().valueOf(),
        };
      }
      return folder;
    }
  ));

  if (!areFoldersBalanced(updatedFolders)) {
    updatedFolders = rebalanceFolders(updatedFolders);
  }

  return updatedFolders;
};

export const reorderItem = (
  unfilteredCollection: any[], // Should be sorted by rank and folder
  itemId: string,
  rank: number,
  options?: {
    updates?: any; // updates that you might want to apply while reordering
  },
) => {
  let updatedCollection = sortByRankAndFolder(
    unfilteredCollection.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          ...(options?.updates || {}),
          rank,
          lastUpdateAtUTC: dayjs().valueOf(),
        }
      }
      return item;
    }
  ));

  if (!areItemsBalanced(updatedCollection)) {
    updatedCollection = rebalanceItems(updatedCollection);
  }

  return updatedCollection;
};
