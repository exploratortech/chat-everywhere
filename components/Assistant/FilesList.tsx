import { UIEvent, useCallback, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";

import FilesModelContext from "./FilesModal.context";
import { FileItem } from "./FileItem";
import Spinner from "../Spinner/Spinner";
import { sortByName } from "@/utils/app/uploadedFiles";

export const FilesList = (): JSX.Element => {
  const {
    state: {
      uploadedFiles,
      uploadedFilenames,
      loading,
      nextFile,
    },
    dispatch,
    loadFiles,
    uploadFiles,
  } = useContext(FilesModelContext);

  const enterTarget = useRef<HTMLElement | null>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation('models');

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    enterTarget.current = event.target as HTMLElement;

    if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];
      if (!item || item.kind !== 'file') return;
    }

    if (dropAreaRef.current) {
      dropAreaRef.current.style.opacity = '1';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (enterTarget.current == event.target) {
      if (dropAreaRef.current) {
        dropAreaRef.current.style.opacity = '0';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();

    let files!: FileList | File[];
    if (event.dataTransfer.items) {
      files = [];
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = event.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } else {
      files = event.dataTransfer.files;
    }

    if (dropAreaRef.current) {
      dropAreaRef.current.style.opacity = '0';
    }

    await uploadFiles(files);
  };

  const handleScroll = useCallback(async (event: UIEvent<HTMLDivElement>): Promise<void> => {
    if (!nextFile || loading) return;
    // Load more files when we reach the bottom of the scroll element
    const target = event.currentTarget;
    if (Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 1) {
      dispatch({ field: 'loading', value: true });
      loadFiles(nextFile)
        .then(({ files, next }) => {
          const updatedUploadedFiles = { ...uploadedFiles };
          const updatedUploadedFilenames = [...uploadedFilenames];

          for (const file of files) {
            if (!uploadedFiles[file.name]) // Prevents duplicate files
              updatedUploadedFilenames.push(file.name);
            updatedUploadedFiles[file.name] = file;
          }
          updatedUploadedFilenames.sort(sortByName);

          dispatch({ field: 'nextFile', value: next });
          dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
          dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
        })
        .finally(() => {
          dispatch({ field: 'loading', value: false });
        });
    }
  }, [uploadedFiles, uploadedFilenames, loading, nextFile, loadFiles, dispatch]);

  return (
    <>
      <div className="flex flex-row justify-between text-sm text-neutral-400 py-2 pl-10 pr-[120px] tablet:pr-[54px]">
        <p>{t('Name')}</p>
        <div className="flex flex-row gap-2">
          <p className="block mobile:hidden">{t('Updated At')}</p>
          <p className="w-20 text-right">{t('Size')}</p>
        </div>
      </div>
      <div className="relative flex flex-col flex-1 overflow-hidden">
        <div
          className="absolute left-0 w-full h-full rounded-md border-2 bg-indigo-300/30 border-indigo-400 opacity-0 transition-opacity ease-out duration-200 pointer-events-none"
          ref={dropAreaRef}
        />
        <div
          className="flex-1 overflow-y-auto"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onScroll={handleScroll}
        >
          {!loading && uploadedFilenames.length <= 0 && (
            <p className="text-[14px] leading-normal text-center text-white opacity-50">{t('No files')}</p>
          )}
          {(uploadedFilenames.map((filename) => {
              const file = uploadedFiles[filename];
              return (
                <FileItem
                  file={file}
                  key={file.name}
                />
              );
            })
          )}
        </div>
        {loading && (
          <div className="absolute left-0 w-full h-full flex justify-center items-center rounded-md bg-black/30">
            <Spinner size="16px" className="mx-auto" />
          </div>
        )}
      </div>
    </>
  );
};
