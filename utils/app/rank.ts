import dayjs from "dayjs";

import { RANK_INTERVAL } from "./const";
import { getNonDeletedCollection } from "./conversation";

// Sorts by ascending rank. Places deleted items at the end of the list
export const sortByRank = (a: any, b: any): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (a.rank == null || b.rank == null) return 0;
  return a.rank - b.rank;
};

// Calculates the new rank of an item given the index of where to move it.
export const generateRank = (collection: any[], insertAt?: number): number => {
  // Set the default insertAt value to the length of the filtered items
  if (insertAt == null || insertAt < 0 || insertAt > collection.length) {
    insertAt = collection.length;
  }

  // Inserting an item at the beginning
  if (insertAt === 0) {
    const bottomItem = collection[insertAt];
    if (!bottomItem || !bottomItem.rank) return RANK_INTERVAL;
    return Math.floor(bottomItem.rank / 2);
  }
  
  // Appending an item to the end
  if (insertAt === collection.length) {
    const topItem = collection[insertAt - 1];
    if (!topItem || !topItem.rank) (collection.length + 1) * RANK_INTERVAL;
    return topItem.rank + RANK_INTERVAL;
  }

  // Inserting an item in the middle
  const topItem = collection[insertAt - 1];
  const bottomItem = collection[insertAt];

  if (!topItem.rank && !bottomItem.rank) {
    return Math.floor((collection.length * RANK_INTERVAL) / 2);
  } else if (!topItem.rank) {
    return Math.floor(bottomItem.rank / 2);
  } else if (!bottomItem.rank) {
    return Math.floor((topItem.rank + collection.length * RANK_INTERVAL) / 2);
  }

  return Math.floor((topItem.rank + bottomItem.rank) / 2);
}

// Checks if the ranks are balanced by seeing if there are any duplicate,
// adjacent items or items with rank values <=0 in the collection. The
// argument is the collection of items sorted by rank.
export const areRanksBalanced = (collection: any[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (
      item1.rank === item2.rank ||
      (item1.rank <= 0 || item2.rank <= 0)) {
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

export const reorderItem = (
  collection: any[],
  itemId: string,
  rank: number,
  additionalFilterPredicate?: (item: any) => boolean,
): any[] => {
  let updatedCollection = collection.map((item) => {
    if (item.id === itemId) {
      return { ...item, rank, lastUpdateAtUTC: dayjs().valueOf() };
    }
    return item;
  });

  updatedCollection.sort(sortByRank);

  const filteredCollection = getNonDeletedCollection(updatedCollection)
  if (additionalFilterPredicate) {
    filteredCollection.filter(additionalFilterPredicate);
  }

  if (!areRanksBalanced(filteredCollection)) {
    updatedCollection = rebalanceRanks(updatedCollection, itemId, rank);
  }

  return updatedCollection;
};
