import { Dialog, Transition } from "@headlessui/react";
import { IconPlus, IconRefresh, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Fragment, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useCreateReducer } from "@/hooks/useCreateReducer";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

import useMediaQuery from "@/hooks/useMediaQuery";
import FilesModalContext, { FilesModalState } from "./FilesModal.context";
import { FilesList } from "./FilesList";
import { UploadedFiles, sortByName } from "@/utils/app/uploadedFiles";
import HomeContext from "@/pages/api/home/home.context";
import { UploadedFile, UploadedFileMap } from "@/types/uploadedFile";

type Props = {
  onClose: () => void;
}

export const FilesModal = ({ onClose }: Props): JSX.Element => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const contextValue = useCreateReducer<FilesModalState>({
    initialState: {
      uploadedFiles: {},
      uploadedFilenames: [],
      loading: false,
      nextFile: null,
      totalFiles: 0,
    },
  });

  const {
    state: {
      uploadedFiles,
      uploadedFilenames,
      loading,
      nextFile,
      totalFiles,
    },
    dispatch,
  } = contextValue;

  const [didInitialFetch, setDidInitialFetch] = useState<boolean>(true);

  const filesListRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation('model');

  const isMobileLayout = useMediaQuery('(max-width: 640px)');

  const checkLoading = useCallback(async (callback: () => Promise<any>): Promise<any> => {
    if (loading) return;
    dispatch({ field: 'loading', value: true });
    const res = await callback();
    dispatch({ field: 'loading', value: false });
    return res;
  }, [loading, dispatch]);

  const loadFiles = useCallback(async (next?: string): Promise<{ files: UploadedFile[], next: string | null, total: number }> => {
    try {
      return await UploadedFiles.load(user?.token, next);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Unable to load files');
      }
      return { files: [], next: null, total: 0 };
    }
  }, [user?.token]);

  const refreshFiles = useCallback(async (): Promise<void> => {
    await checkLoading(async (): Promise<void> => {
      return new Promise((resolve) => {
        loadFiles()
          .then(({ files, next, total }) => {
            filesListRef.current?.scrollTo({ top: 0 });

            const updatedUploadedFiles: UploadedFileMap = {};
            const updatedUploadedFilenames: string[] = [];

            for (const file of files) {
              updatedUploadedFiles[file.name] = file;
              updatedUploadedFilenames.push(file.name);
            }

            dispatch({ field: 'nextFile', value: next });
            dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
            dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
            dispatch({ field: 'totalFiles', value: total });
          })
          .finally(() => {
            resolve();
          });
      });
    });
  }, [checkLoading, loadFiles, dispatch]);

  const handleUploadFiles = useCallback(async (files: FileList | File[]): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        const {
          files: newUploadedFiles,
          errors,
          count,
        } = await UploadedFiles.upload(files, user?.token);

        for (const error of errors) {
          toast.error(error.message);
        }

        const updatedUploadedFiles = { ...uploadedFiles };
        const updatedUploadedFilenames = [...uploadedFilenames];
        
        for (const filename of Object.keys(newUploadedFiles)) {
          // Add the uploaded files to the local collection if the already fetched
          // files would've included them, otherwise, don't include them. The new
          // files will be fetched when paginating. This is to ensure consistent
          // pagination behaviour.
          if (!nextFile || filename.toUpperCase() < nextFile.toUpperCase()) {
            updatedUploadedFiles[filename] = newUploadedFiles[filename];

            if (!uploadedFiles[filename]) // Prevent duplicates
              updatedUploadedFilenames.push(filename);
          }
        }

        updatedUploadedFilenames.sort(sortByName);
  
        dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
        dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
        dispatch({ field: 'totalFiles', value: totalFiles + count });
  
        return true;
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {{
          toast.error('Unable to upload file(s)');
        }}
        return false;
      }
    });
  }, [checkLoading, uploadedFiles, uploadedFilenames, nextFile, totalFiles, user?.token, dispatch]);

  const handleDeleteFile = useCallback(async (filename: string): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        const { count } = await UploadedFiles.remove([filename], user?.token);
        
        const updatedUploadedFiles = { ...uploadedFiles };
        delete updatedUploadedFiles[filename];
  
        dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
        dispatch({
          field: 'uploadedFilenames',
          value: Object.keys(updatedUploadedFiles).sort(sortByName),
        });
        dispatch({ field: 'totalFiles', value: totalFiles - count });
  
        return true;
      } catch (error) {
        if (error instanceof Error)
          toast.error(error.message);
        else
          toast.error('Unable to remove file');
        return false;
      }
    });
  }, [checkLoading, uploadedFiles, totalFiles, user?.token, dispatch]);

  const handleRenameFile = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        await UploadedFiles.rename(oldName, newName, user?.token);
  
        const updatedUploadedFiles = { ...uploadedFiles };
        updatedUploadedFiles[newName] = {
          ...updatedUploadedFiles[oldName],
          name: newName,
          updatedAt: dayjs().toISOString(),
        };
        delete updatedUploadedFiles[oldName];
  
        const updatedUploadedFilenames = uploadedFilenames.filter(
          (filename) => filename !== oldName
        );
        updatedUploadedFilenames.push(newName);
        updatedUploadedFilenames.sort(sortByName);
  
        dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
        dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
  
        return true;
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Unable to rename file');
        }
        return false;
      }
    });
  }, [checkLoading, uploadedFiles, uploadedFilenames, user?.token, dispatch]);

  const handleDownloadFile = useCallback(async (filename: string): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        const link = document.createElement('a');
        const blob = await UploadedFiles.download([filename], user?.token);
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        return true;
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to download file');
        }
        return false;
      }
    });
  }, [checkLoading, user?.token]);

  useEffect(() => {
    if (!didInitialFetch && !loading) {
      setDidInitialFetch(true);
      refreshFiles();
    }
  }, [didInitialFetch, loading, refreshFiles]);

  useEffect(() => {
    setDidInitialFetch(false);
    if (user?.token) {
      UploadedFiles.syncLocal(user.token)
        .then((result) => {
          if (result == null) return;
          for (const error of result) {
            toast.error(`Unable to sync file: ${error.filename}`);
          }
        });
    }
  }, [user?.token]);

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <FilesModalContext.Provider
          value={{
            ...contextValue,
            closeModel: onClose,
            loadFiles,
            deleteFile: handleDeleteFile,
            renameFile: handleRenameFile,
            downloadFile: handleDownloadFile,
            uploadFiles: handleUploadFiles,
          }}
        >
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center mobile:block">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className=" w-full max-w-[1150px] tablet:max-w-[90vw] h-[calc(100vh-100px)] transform overflow-hidden rounded-2xl  text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex mobile:h-[100dvh] max-h-[750px] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                <div className="relative flex flex-col flex-grow p-6 bg-neutral-900 overflow-y-auto">
                  <h1 className="font-bold mb-4">{t("Files")}</h1>
                  <div className="flex flex-row items-center gap-2">
                    <button
                      className="flex flex-row items-center self-start gap-x-3 mb-4 p-3 rounded-md border border-white/20 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10 select-none"
                      disabled={loading}
                      onClick={async (): Promise<void> => {
                        const files = await UploadedFiles.openUploadWindow();
                        await handleUploadFiles(files);
                      }}
                    >
                      <IconPlus size={16} />
                      {isMobileLayout
                        ? t('Upload files')
                        : t('Drag and drop or choose files to upload')}
                    </button>
                    <button
                      className="flex flex-row items-center self-start gap-x-3 mb-4 p-3 rounded-md border border-white/20 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10 select-none"
                      disabled={loading}
                      onClick={refreshFiles}
                    >
                      <IconRefresh size={16} />
                      {isMobileLayout ? '' : t('Refresh')}
                    </button>
                  </div>
                  <FilesList ref={filesListRef} />
                  <button
                    className="w-max min-h-[34px] p-4 absolute top-0 right-0"
                    onClick={onClose}
                  >
                    <IconX />
                  </button>
                </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </FilesModalContext.Provider>
      </Dialog>
    </Transition>
  );
};
