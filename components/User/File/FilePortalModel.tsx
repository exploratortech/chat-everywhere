import { Dialog, Transition } from '@headlessui/react';
import {
  IconAlertCircle,
  IconRotateClockwise,
  IconX,
} from '@tabler/icons-react';
import { IconUpload } from '@tabler/icons-react';
import React, { Fragment, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useFileUpload } from '@/hooks/file/useFileUpload';
import { useMultipleFileUploadHandler } from '@/hooks/file/useMultipleFileUploadHandler';

import DragAndDrop from '@/components/FileDragDropArea/DragAndDrop';
import { FileListGridView } from '@/components/Files/FileListGridView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import PreviewVersionFlag from '@/components/ui/preview-version-flag';

import { UploadProgress } from './UploadProgress';

type Props = {
  onClose: () => void;
};

export default function FilePortalModel({ onClose }: Props) {
  const { t } = useTranslation('model');
  const { t: sidebarT } = useTranslation('sidebar');
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
                          <UploadFileComponent />
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
                      console.log('Files dropped:', files);
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

const UploadFileComponent = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onComplete = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const { isLoading, uploadProgress, uploadFiles } =
    useMultipleFileUploadHandler({ onCompleteFileUpload: onComplete });

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const { t } = useTranslation('model');

  return (
    <div>
      <div className="flex gap-4">
        <Button
          className="min-w-[7.5rem] inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 bg-neutral-50 text-neutral-900 hover:bg-neutral-50/90 focus:ring-neutral-300"
          onClick={triggerFileInput}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <IconRotateClockwise className="mr-2 h-4 w-4 animate-spin" />
              {t('Loading...')}
            </>
          ) : (
            <>
              <IconUpload className="mr-2 h-4 w-4" />
              {t('Upload')}
            </>
          )}
        </Button>
        <div className="flex-1">
          {isLoading && <UploadProgress progressNumber={uploadProgress || 0} />}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf, text/plain, audio/aac, audio/flac, audio/mp3, audio/m4a, audio/mpeg, audio/mpga, audio/mp4, audio/opus, audio/pcm, audio/wav, audio/webm, image/png, image/jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            uploadFiles(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
