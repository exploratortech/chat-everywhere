import type { FolderInterface } from '@/types/folder';

import { RANK_INTERVAL } from './const';

import dayjs from 'dayjs';

// Only use for collections where items have folderIds.
export const sortByRankAndFolder = (collection: any[]) => {
  return [...collection].sort((a, b) => {
    // Moves deleted items to the bottom of the collection
    if (!a.deleted && b.deleted) return -1;
    if (a.deleted && !b.deleted) return 1;

    // Items with null folder ids are sorted before items with folder ids.
    if (!a.folderId && b.folderId) return -1;
    if (a.folderId && !b.folderId) return 1;

    if (a.folderId > b.folderId) return 1;
    if (a.folderId < b.folderId) return -1;

    if (a.rank > b.rank) return 1;
    if (a.rank < b.rank) return -1;

    return 0;
  });
};

export const sortByRankAndFolderType = (folders: FolderInterface[]) => {
  return [...folders].sort((a, b) => {
    if (!a.deleted && b.deleted) return -1;
    if (a.deleted && !b.deleted) return 1;

    // Chat folders will be sorted before prompt folders
    if (a.type > b.type) return 1;
    if (a.type < b.type) return -1;

    if (a.rank > b.rank) return 1;
    if (a.rank < b.rank) return -1;

    return 0;
  });
};

// Calculates the new rank of an item given the index of where to move it.
// 'filteredCollection' should be a collection of items sorted by rank with
// all items having a common folderId. The item that's to be moved should not
// be in the filtered collection, otherwise, the calculations will be off.
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
  if (insertAt >= filteredCollection.length) {
    const topItem = filteredCollection[filteredCollection.length - 1];
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
// The collection has to be sorted by rank and folder type.
export const areFoldersBalanced = (collection: FolderInterface[]): boolean => {
  for (let i = 0; i < collection.length; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];

    if (item1.deleted) continue;
    if (item1.rank <= 0) return false;

    if (item2) {
      if (item2.deleted) continue;
      if (item1.rank === item2.rank && item1.type === item2.type) return false;
      if (item2.rank <= 0) return false;
    }
  }

  return true;
};

// For conversations and prompts
// The collection has to be sorted by rank and folder.
export const areItemsBalanced = (collection: any[]): boolean => {
  for (let i = 0; i < collection.length - 1; i++) {
    const item1 = collection[i];
    const item2 = collection[i + 1];
    if (item1.deleted || item2.deleted) continue;
    if (
      (item1.rank === item2.rank && item1.folderId === item2.folderId) ||
      item1.rank <= 0 ||
      item2.rank <= 0
    ) {
      return false;
    }
  }
  return true;
};

// Rebalances the ranks of the collection. Requires that the collection is in
// sorted order by ranks and that items with conflicting ranks are adjacent
// to each other.
export const rebalanceFolders = (
  sortedFolders: FolderInterface[],
): FolderInterface[] => {
  if (!sortedFolders.length) return sortedFolders;

  const lastUpdateAtUTC = dayjs().valueOf();
  let currentFolderType = sortedFolders[0].type;
  let currentRank = RANK_INTERVAL;

  return sortedFolders.map((folder) => {
    if (!folder || folder.deleted) return folder;

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
    };

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
  superCollection: FolderInterface[],
  targetId: string,
  sourceIndex: number,
  destinationIndex: number,
): FolderInterface[] => {
  const superIndex = superCollection.findIndex(
    (folder) => folder.id === targetId,
  );

  let updatedCollection = [...superCollection];
  let target = updatedCollection.splice(superIndex, 1)[0];

  const filteredCollection = updatedCollection.filter(
    (folder) => !folder.deleted && folder.type === target.type,
  );

  const rank = generateRank(filteredCollection, destinationIndex);

  target = {
    ...target,
    rank,
    lastUpdateAtUTC: dayjs().valueOf(),
  };

  updatedCollection.splice(
    superIndex - sourceIndex + destinationIndex,
    0,
    target,
  );

  if (!areFoldersBalanced(updatedCollection)) {
    updatedCollection = rebalanceFolders(updatedCollection);
  }

  return sortByRankAndFolderType(updatedCollection);
};

export const reorderItem = (
  superCollection: any[],
  targetId: string,
  sourceIndex: number,
  destinationIndex: number,
  folderId?: string,
): any[] => {
  // Find the index of the item that's being dragged in the
  // "super collection". The super collection contains all
  // conversations sorted using sortByRankAndFolder().
  const superSourceIndex = superCollection.findIndex(
    (item) => item.id === targetId,
  );

  // Retrieve the item from the super collection.
  let updatedCollection = [...superCollection];
  let target = updatedCollection.splice(superSourceIndex, 1)[0];

  // Filter the super collection for items that are in the relevant
  // droppable (folder or none). Then generate a rank using the filtered
  // collection.
  const filteredCollection = updatedCollection.filter(
    (item) => !item.deleted && item.folderId === (folderId || null),
  );

  const rank = generateRank(filteredCollection, destinationIndex);

  target = {
    ...target,
    rank,
    folderId: folderId || null,
    lastUpdateAtUTC: dayjs().valueOf(),
  };

  // Insert the updated conversation into the super collection. Requires
  // converting the local destination index to a super index.
  updatedCollection.splice(
    superSourceIndex - sourceIndex + destinationIndex,
    0,
    target,
  );

  if (!areItemsBalanced(updatedCollection)) {
    updatedCollection = rebalanceItems(updatedCollection);
  }

  return sortByRankAndFolder(updatedCollection);
};
