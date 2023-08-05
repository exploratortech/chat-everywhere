import { Dialog, Transition } from "@headlessui/react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Fragment, useCallback, useContext, useEffect, useState } from "react";
import { useCreateReducer } from "@/hooks/useCreateReducer";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

import FilesModalContext, { FilesModalState } from "./FilesModal.context";
import { FilesList } from "./FilesList";
import { UploadedFiles, sortByName } from "@/utils/app/uploadedFiles";
import HomeContext from "@/pages/api/home/home.context";
import { UploadedFileMap } from "@/types/uploadedFile";

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
    },
  });

  const {
    state: {
      uploadedFiles,
      uploadedFilenames,
      loading,
      nextFile,
    },
    dispatch,
  } = contextValue;

  const [didInitialFetch, setDidInitialFetch] = useState<boolean>(true);

  const { t } = useTranslation('model');

  const checkLoading = useCallback(async (callback: () => Promise<any>): Promise<any> => {
    if (loading) return;
    dispatch({ field: 'loading', value: true });
    const res = await callback();
    dispatch({ field: 'loading', value: false });
    return res;
  }, [loading, dispatch]);

  const loadFiles = useCallback(async () => {// checkLoading<{ files: UploadedFile[], next: string | null }>(async () => {
      try {
        return await UploadedFiles.load(user?.token, nextFile);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Unable to load files');
        }
        return { files: [], next: null };
      }
  }, [nextFile, user?.token]);

  const handleUploadFiles = useCallback(async (files: FileList | File[]): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        const [newUploadedFiles, errors] = await UploadedFiles.upload(files, user?.token);
        const updatedUploadedFilenames = [...uploadedFilenames, ...Object.keys(newUploadedFiles)];
        updatedUploadedFilenames.sort(sortByName);
  
        for (const error of errors) {
          toast.error(`Unable to upload file: ${error.filename}`);
        }
  
        dispatch({
          field: 'uploadedFiles',
          value: { ...uploadedFiles, ...newUploadedFiles },
        });
  
        dispatch({
          field: 'uploadedFilenames',
          value: updatedUploadedFilenames,
        });
  
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
  }, [checkLoading, uploadedFiles, uploadedFilenames, user?.token, dispatch]);

  const handleDeleteFile = useCallback(async (filename: string): Promise<boolean> => {
    return await checkLoading(async () => {
      try {
        const deletedFilenames = await UploadedFiles.remove([filename], user?.token);
        const updatedUploadedFiles = { ...uploadedFiles };
        const updatedUploadedFilenames: string[] = [];
  
        for (const filename of deletedFilenames) {
          delete updatedUploadedFiles[filename];
        }
  
        // Retain the files that weren't deleted
        for (const filename of uploadedFilenames) {
          if (!deletedFilenames.includes(filename)) {
            updatedUploadedFilenames.push(filename);
          }
        }
  
        dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
        dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
  
        return true;
      } catch (error) {
        if (error instanceof Error)
          toast.error(error.message);
        else
          toast.error('Unable to remove file');
        return false;
      }
    });
  }, [checkLoading, uploadedFiles, uploadedFilenames, user?.token, dispatch]);

  const handleRenameFile= useCallback(async (oldName: string, newName: string): Promise<boolean> => {
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

  useEffect(() => {
    if (!didInitialFetch && !loading) {
      setDidInitialFetch(true);
      dispatch({ field: 'loading', value: true });
      loadFiles()
        .then(({ files, next }) => {
          const updatedUploadedFiles: UploadedFileMap = {};
          const updatedUploadedFilenames: string[] = [];

          for (const file of files) {
            updatedUploadedFiles[file.name] = file;
            updatedUploadedFilenames.push(file.name);
          }

          dispatch({ field: 'nextFile', value: next });
          dispatch({ field: 'uploadedFiles', value: updatedUploadedFiles });
          dispatch({ field: 'uploadedFilenames', value: updatedUploadedFilenames });
        })
        .finally(() => {
          dispatch({ field: 'loading', value: false });
        });
    }
  }, [didInitialFetch, loadFiles, loading, dispatch]);

  useEffect(() => {
    setDidInitialFetch(false);
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
                  <button
                    className="flex flex-row items-center self-start gap-x-3 mb-4 p-3 rounded-md border border-white/20 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10 select-none"
                    onClick={async (): Promise<void> => {
                      const files = await UploadedFiles.openUploadWindow();
                      await handleUploadFiles(files);
                    }}
                  >
                    <IconPlus size={16} />
                    {t('Drag and drop or choose files to upload')}
                  </button>
                  <FilesList />
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
