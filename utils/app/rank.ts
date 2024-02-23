import { RANK_INTERVAL } from './const';
import { getNonDeletedCollection } from './conversation';
import type { Conversation } from '@/types/chat';
import type { Prompt } from '@/types/prompt';

import dayjs from 'dayjs';

// Sorts by ascending rank. Places deleted items at the end of the list
export const sortByRank = (a: any, b: any): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (a.folderId && b.folderId && a.folderId !== b.folderId)
    return 0; // Important for sortByRankAndFolder
  if (a.rank == null || b.rank == null) return 0;
  return a.rank - b.rank;
};

// Sorts collection based on folders. Effectively groups items within
// a collection with other items that belong to the same group/no group.
export const sortByFolder = (a: any, b: any): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (!a.folderId && b.folderId) return 1;
  if (a.folderId && !b.folderId) return -1;
  if (!a.folderId && !b.folderId) return 0;
  // How the following comparison is done doesn't matter.
  return a.folderId > b.folderId ? 1 : -1;
};

export const sortByRankAndFolder = <T>(collection: T[]) => {
  return [...collection].sort(sortByFolder).sort(sortByRank);
};

// Calculates the new rank of an item given the index of where to move it.
export const generateRank = (
  filteredCollection: any[],
  insertAt?: number,
): number => {
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

// Checks if the ranks are balanced by seeing if there are any duplicate,
// adjacent items or items with rank values <=0 in the collection. The
// argument is the collection of items sorted by rank.
export const areRanksBalanced = (collection: any[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (item1.rank === item2.rank || item1.rank <= 0 || item2.rank <= 0) {
      return false;
    }
  }

  return true;
};

// The collection has to be sorted by rank and folder but doesn't need to filtered.
export const areRanksBalanced2 = (collection: any[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (!item2) continue;
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
export const rebalanceRanks = (
  collection: any[],
  itemId: string,
  rank: number,
): any[] => {
  const rebalancedCollection: any[] = [];

  let currentRank = RANK_INTERVAL;
  for (let i = 0; i < collection.length; i++) {
    const currentItem = collection[i];

    if (currentItem.deleted) {
      rebalancedCollection.push(currentItem);
      continue;
    }

    // This block ensures that the moved item gets inserted after the
    // conflicting item when the item is moved in the middle/to the end of
    // the list.
    if (currentItem.rank === rank && i + 1 < collection.length) {
      const afterFolder = collection[i + 1];
      if (afterFolder.rank === rank && currentItem.id === itemId) {
        rebalancedCollection.push({
          ...afterFolder,
          rank: currentRank,
          lastUpdateAtUTC: dayjs().valueOf(),
        });
        currentRank += RANK_INTERVAL;
        i++; // Skip the next item as we just inserted it already
      }
    }

    rebalancedCollection.push({
      ...currentItem,
      rank: currentRank,
      lastUpdateAtUTC: dayjs().valueOf(),
    });

    currentRank += RANK_INTERVAL;
  }

  return rebalancedCollection;
};

// The collection has to be sorted by rank and folder but doesn't need to filtered.
export const rebalanceRanks2 = (collection: any[]): any[] => {
  if (!collection.length) return collection;

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
      lastUpdateAtUTC: dayjs().valueOf(),
    };

    currentRank += RANK_INTERVAL;

    return updatedItem;
  });
};

export const reorderItem = (
  collection: any[],
  itemId: string,
  rank: number,
  options?: {
    filter?: (item: any) => boolean; // additional filter
    updates?: any; // updates that you might want to apply while reordering
  },
): any[] => {
  let updatedCollection = collection.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        ...(options?.updates || {}),
        rank,
        lastUpdateAtUTC: dayjs().valueOf(),
      };
    }
    return item;
  });

  updatedCollection.sort(sortByRank).sort(sortByFolder);

  let filteredCollection = getNonDeletedCollection(updatedCollection);
  if (options?.filter) {
    filteredCollection = filteredCollection.filter(options.filter);
  }

  if (!areRanksBalanced(filteredCollection)) {
    updatedCollection = rebalanceRanks(updatedCollection, itemId, rank);
  }

  return updatedCollection;
};

export const reorderItem2 = (
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
    })
  );

  if (!areRanksBalanced2(updatedCollection)) {
    updatedCollection = rebalanceRanks2(updatedCollection);
  }

  return updatedCollection;
};
