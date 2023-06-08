import { FolderInterface } from '@/types/folder';
import { RANK_INTERVAL } from '@/utils/app/const';

export const saveFolders = (folders: FolderInterface[]) => {
  localStorage.setItem('folders', JSON.stringify(folders));
};

export const getNextFolderRank = (folders: FolderInterface[]): number => {
  // TODO: Look into this some more
  let largestRank: number = 0;
  folders.forEach((folder: FolderInterface) => {
    if (folder.rank > largestRank) {
      largestRank = folder.rank;
    }
  });
  return largestRank + RANK_INTERVAL;
};

// Sorts by ascending rank
export const sortByRank = (a: FolderInterface, b: FolderInterface): number => {
  if (!a.rank || !b.rank) return 0;
  return a.rank - b.rank;
};

// Calculates the rank given
export const generateFolderRank = (folders: FolderInterface[], index: number): number => {
  // Filter out the folders that were deleted
  folders = folders.filter((folder) => !folder.deleted);

  // Inserting a folder at the beginning
  if (index === 0) {
    const bottomFolder: FolderInterface = folders[index];
    if (!bottomFolder.rank) return RANK_INTERVAL;
    return Math.floor(bottomFolder.rank / 2);
  }
  
  // Appending folder to the end
  if (index >= folders.length) {
    const topFolder: FolderInterface = folders[index];
    if (!topFolder.rank) return folders.length * RANK_INTERVAL;
    return topFolder.rank + RANK_INTERVAL;
  }

  // Inserting folder in the middle
  const topFolder: FolderInterface = folders[index - 1];
  const bottomFolder: FolderInterface = folders[index];

  if (!topFolder.rank && !bottomFolder.rank) {
    return Math.floor((folders.length * RANK_INTERVAL) / 2);
  } else if (!topFolder.rank) {
    return Math.floor(bottomFolder.rank / 2);
  } else if (!bottomFolder.rank) {
    return Math.floor((topFolder.rank + folders.length * RANK_INTERVAL) / 2);
  }

  // Check if the ranks need to be rebalanced by seeing if the gap between ranks
  // is sufficiently big enough (>1)
  if (bottomFolder.rank - topFolder.rank <= 1) {
    // TODO: Rebalance
    console.log("Rebalance ranks");
  }

  return Math.floor((topFolder.rank + bottomFolder.rank) / 2);
}
