import dayjs from 'dayjs';

import { FolderInterface, FolderType } from '@/types/folder';
import { RANK_INTERVAL } from '@/utils/app/const';
import { getNonDeletedCollection } from './conversation';

export const saveFolders = (folders: FolderInterface[]) => {
  localStorage.setItem('folders', JSON.stringify(folders));
};

// Sorts by ascending rank. Places deleted folders at the end of the list while.
export const sortByRank = (a: FolderInterface, b: FolderInterface): number => {
  if (a.deleted) return 1;
  if (b.deleted) return -1;
  if (a.rank == null || b.rank == null) return 0;
  return a.rank - b.rank;
};

// Calculates the new rank of a folder given the index of where to move it.
export const generateFolderRank = (
  folders: FolderInterface[],
  folderType: FolderType,
  insertAt?: number,
): number => {
  // Filter out the folders that were deleted
  folders = getNonDeletedCollection(folders)
    .filter((folder: FolderInterface) => folder.type === folderType);

  // Set the default insertAt value to the length of the filtered folders
  if (insertAt == null || insertAt < 0 || insertAt > folders.length) {
    insertAt = folders.length;
  }

  // Inserting a folder at the beginning
  if (insertAt === 0) {
    const bottomFolder: FolderInterface = folders[insertAt];
    if (!bottomFolder || !bottomFolder.rank) return RANK_INTERVAL;
    return Math.floor(bottomFolder.rank / 2);
  }
  
  // Appending folder to the end
  if (insertAt === folders.length) {
    const topFolder: FolderInterface = folders[insertAt - 1];
    if (!topFolder || !topFolder.rank) (folders.length + 1) * RANK_INTERVAL;
    return topFolder.rank + RANK_INTERVAL;
  }

  // Inserting folder in the middle
  const topFolder: FolderInterface = folders[insertAt - 1];
  const bottomFolder: FolderInterface = folders[insertAt];
  console.log('folders:', folders);

  if (!topFolder.rank && !bottomFolder.rank) {
    return Math.floor((folders.length * RANK_INTERVAL) / 2);
  } else if (!topFolder.rank) {
    return Math.floor(bottomFolder.rank / 2);
  } else if (!bottomFolder.rank) {
    return Math.floor((topFolder.rank + folders.length * RANK_INTERVAL) / 2);
  }

  return Math.floor((topFolder.rank + bottomFolder.rank) / 2);
}

// Checks if the ranks are balanced by seeing if there are any duplicate,
// adjacent items or folders with rank values <=0 in the collection. The
// argument is the collection of folders sorted by rank.
export const areRanksBalanced = (
  folders: FolderInterface[],
  folderType: FolderType,
): boolean => {
  // Filter out the folders that were deleted
  folders = getNonDeletedCollection(folders)
    .filter((folder: FolderInterface) => folder.type === folderType);

  for (let i = 0; i < folders.length - 1; i++) {
    const folder1 = folders[i];
    const folder2 = folders[i + 1];
    if (
      folder1.rank === folder2.rank ||
      (folder1.rank <= 0 || folder2.rank <= 0)) {
      return false;
    }
  }

  return true;
};

// Rebalances the ranks of the folders. Requires that the folders are in sorted
// order by ranks and that folders with conflicting ranks are adjacent to each
// other.
export const rebalanceRanks = (
  folders: FolderInterface[],
  folderId: string,
  rank: number,
): FolderInterface[] => {
  const rebalancedFolders: FolderInterface[] = [];

  let currentRank = RANK_INTERVAL;
  for (let i = 0; i < folders.length; i++) {
    const currentFolder = folders[i];

    if (currentFolder.deleted) {
      rebalancedFolders.push(currentFolder);
      continue;
    }

    // This block ensures that the moved folder gets inserted after the
    // conflicting folder when the folder is moved in the middle/to the end of
    // the list.
    if (currentFolder.rank === rank && i + 1 < folders.length) {
      const afterFolder = folders[i + 1];
      if (afterFolder.rank === rank && currentFolder.id === folderId) {
        rebalancedFolders.push({
          ...afterFolder,
          rank: currentRank,
          lastUpdateAtUTC: dayjs().valueOf(),
        });
        currentRank += RANK_INTERVAL;
        i++; // Skip the next folder as we just inserted it already
      }
    }

    rebalancedFolders.push({
      ...currentFolder,
      rank: currentRank,
      lastUpdateAtUTC: dayjs().valueOf(),
    });

    currentRank += RANK_INTERVAL;
  }

  return rebalancedFolders;
};
