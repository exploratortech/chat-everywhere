import type { FC, MutableRefObject } from 'react';

import type { UserFile } from '@/types/UserFile';

interface Props {
  files: UserFile[];
  activeFileIndex: number;
  onSelect: (file: UserFile) => void;
  onMouseOver: (index: number) => void;
  fileListRef: MutableRefObject<HTMLUListElement | null>;
}

export const FileList: FC<Props> = ({
  files,
  activeFileIndex,
  onSelect,
  onMouseOver,
  fileListRef,
}) => {
  return (
    <ul
      ref={fileListRef}
      className="z-10 max-h-52 w-full overflow-scroll rounded border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-neutral-500 dark:bg-[#343541] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
    >
      {files?.map((file, index) => (
        <li
          key={`${file.id}-${index}`} // Since files are strings and might not be unique, use index as key
          className={`${
            index === activeFileIndex
              ? 'bg-gray-200 dark:bg-[#202123] dark:text-black'
              : ''
          } cursor-pointer px-3 py-2 text-sm text-black dark:text-white`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(file);
          }}
          onMouseEnter={() => onMouseOver(index)}
        >
          {file.filename}
        </li>
      ))}
    </ul>
  );
};
