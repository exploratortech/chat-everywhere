import { Dialog, Transition } from '@headlessui/react';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { useMultipleFileUploadHandler } from '@/hooks/file/useMultipleFileUploadHandler';

import {
  createFileList,
  validateAndUploadFiles,
} from '@/utils/app/uploadFileHelper';

import DragAndDrop from '@/components/FileDragDropArea/DragAndDrop';
import { FileListGridView } from '@/components/Files/FileListGridView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PreviewVersionFlag from '@/components/ui/preview-version-flag';

import UploadFileButton from './UploadFileButton';

type Props = {
  onClose: () => void;
};

export default function FilePortalModel({ onClose }: Props) {
  const { t } = useTranslation('model');
  const { t: sidebarT } = useTranslation('sidebar');

  const { uploadFiles, isLoading: isUploading } =
    useMultipleFileUploadHandler();
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} open>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/50" />
        </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-[85vw] tablet:max-w-[90vw] h-[85vh] transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex mobile:h-[100dvh] max-h-[90vh] tablet:max-h-[unset] mobile:!max-w-[unset] mobile:!rounded-none">
                <div className="bg-neutral-900 flex-grow relative overflow-y-auto">
                  <div className="p-6">
                    <button
                      className="w-max min-h-[34px] p-4 absolute top-0 right-0"
                      onClick={onClose}
                    >
                      <IconX />
                    </button>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-neutral-200 font-bold">
                          {sidebarT('File Portal')}
                          <PreviewVersionFlag />
                        </div>
                        <div className="p-4">
                          <div className="flex gap-4">
                            <UploadFileButton
                              onFilesDrop={async (files) => {
                                await validateAndUploadFiles(
                                  files,
                                  uploadFiles,
                                  () => {},
                                  t,
                                );
                              }}
                              isUploading={isUploading}
                            />
                          </div>
                        </div>
                        <div className="p-4">
                          <Alert className="bg-yellow-100 text-black">
                            <IconAlertCircle className="h-4 w-4 !text-yellow-500 " />
                            <AlertTitle className="text-base font-medium">
                              {t('Warning')}
                            </AlertTitle>
                            <AlertDescription>
                              <ul>
                                <li>{t('File Size Limitation')}: 50 MB</li>
                                <li>
                                  {t('PDF Page Limitation')}:{' '}
                                  {t('{{pages}} Pages', { pages: 300 })}
                                </li>
                              </ul>
                            </AlertDescription>
                          </Alert>
                        </div>

                        <div className="py-4">
                          <FileListGridView closeDialogCallback={onClose} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DragAndDrop
                    onFilesDrop={(files) => {
                      validateAndUploadFiles(
                        createFileList(files),
                        uploadFiles,
                        () => {},
                        t,
                      );
                    }}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
