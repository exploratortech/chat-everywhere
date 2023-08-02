import { Dialog, Transition } from "@headlessui/react";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Fragment, useCallback, useContext, useEffect } from "react";
import { useCreateReducer } from "@/hooks/useCreateReducer";
import { toast } from "react-hot-toast";

import AttachmentsModelContext, { AttachmentsModelState } from "./AttachmentsModel.context";
import { AttachmentsList } from "./AttachmentsList";
import { Attachments } from "@/utils/app/attachments";
import HomeContext from "@/pages/api/home/home.context";

type Props = {
  onClose: () => void;
}

export const AttachmentsModel = ({ onClose }: Props): JSX.Element => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const contextValue = useCreateReducer<AttachmentsModelState>({
    initialState: {
      attachments: {},
    },
  });

  const {
    state: { attachments },
    dispatch,
  } = contextValue;

  const { t } = useTranslation('model');

  const handleUploadAttachments = useCallback(async (files: FileList | File[]): Promise<boolean> => {
    try {
      const [uploadedAttachments, errors] = await Attachments.upload(files, user?.token);
      for (const error of errors) {
        toast.error(`Unable to upload file: ${error.filename}`);
      }
      dispatch({
        field: 'attachments',
        value: { ...attachments, ...uploadedAttachments },
      });
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {{
        toast.error('Unable to upload file(s)');
      }}
      return false;
    }
  }, [attachments, user?.token, dispatch]);

  const handleDeleteAttachment = useCallback(async (attachmentName: string): Promise<boolean> => {
    try {
      const deletedFilenames = await Attachments.remove([attachmentName], user?.token);
      const updatedAttachments = { ...attachments };
      for (const filename of deletedFilenames) {
        delete updatedAttachments[filename];
      }
      dispatch({
        field: 'attachments',
        value: updatedAttachments,
      });
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error('Unable to remove file');
      return false;
    }
  }, [attachments, user?.token, dispatch]);

  const handleRenameAttachment = useCallback((oldName: string, newName: string) => {
    try {
      const updatedAttachments = Attachments.rename(oldName, newName);
      dispatch({ field: 'attachments', value: updatedAttachments });
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof Error)
        toast.error(error.message);
      else
        toast.error('Unable to rename file');
      return false;
    }
  }, [dispatch]);

  useEffect(() => {
    const data = localStorage.getItem('attachments');
    if (!data) return;

    const attachments = JSON.parse(data);
    dispatch({ field: 'attachments', value: attachments });
  }, [dispatch]);

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

        <AttachmentsModelContext.Provider
          value={{
            ...contextValue,
            closeModel: onClose,
            deleteAttachment: handleDeleteAttachment,
            renameAttachment: handleRenameAttachment,
            uploadAttachments: handleUploadAttachments,
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
                      const files = await Attachments.openUploadWindow();
                      await handleUploadAttachments(files);
                    }}
                  >
                    <IconPlus size={16} />
                    {t('Drag and drop or choose files to upload')}
                  </button>
                  <AttachmentsList />
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
        </AttachmentsModelContext.Provider>
      </Dialog>
    </Transition>
  );
};
