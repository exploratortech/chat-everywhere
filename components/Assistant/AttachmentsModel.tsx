import { Dialog, Transition } from "@headlessui/react";
import { IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Fragment, useCallback, useEffect } from "react";
import { useCreateReducer } from "@/hooks/useCreateReducer";

import AttachmentsModelContext, { AttachmentsModelState } from "./AttachmentsModel.context";
import { AttachmentsList } from "./AttachmentsList";
import { Attachments } from "@/utils/app/attachments";
import { toast } from "react-hot-toast";

type Props = {
  onClose: () => void;
}

export const AttachmentsModel = ({ onClose }: Props): JSX.Element => {

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

  const handleDeleteAttachment = useCallback((attachmentName: string): void => {
    try {
      const updatedAttachments = Attachments.remove(attachmentName);
      dispatch({ field: 'attachments', value: updatedAttachments });
    } catch (error) {
      console.error(error);
      toast.error("Unable to delete file");
    }
  }, [dispatch]);

  const handleRenameAttachment = useCallback((oldName: string, newName: string) => {
    try {
      const updatedAttachments = Attachments.rename(oldName, newName);
      dispatch({ field: 'attachments', value: updatedAttachments });
    } catch (error) {
      toast.error("Unable to rename file");
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
                <div className="p-6 bg-neutral-900 flex-grow relative overflow-y-auto">
                  <h1 className="font-bold mb-4">{t("Files")}</h1>
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
