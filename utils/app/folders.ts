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
export const generateFolderRank = (folders: FolderInterface[], insertAt?: number): number => {
  // Filter out the folders that were deleted
  folders = folders.filter((folder) => !folder.deleted);

  // Set the default insertAt value to the length of the filtered folders
  if (insertAt == null || insertAt < 0 || insertAt > folders.length) {
    insertAt = folders.length;
  }

  // Inserting a folder at the beginning
  if (insertAt === 0) {
    console.log('generateFolderRank, insert at top');
    const bottomFolder: FolderInterface = folders[insertAt];
    if (!bottomFolder || !bottomFolder.rank) return RANK_INTERVAL;
    return Math.floor(bottomFolder.rank / 2);
  }
  
  // Appending folder to the end
  if (insertAt === folders.length) {
    console.log('generateFolderRank, append to end');
    const topFolder: FolderInterface = folders[insertAt - 1];
    if (!topFolder || !topFolder.rank) return (folders.length + 1) * RANK_INTERVAL;
    return topFolder.rank + RANK_INTERVAL;
  }

  // Inserting folder in the middle
  const topFolder: FolderInterface = folders[insertAt - 1];
  const bottomFolder: FolderInterface = folders[insertAt];

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
