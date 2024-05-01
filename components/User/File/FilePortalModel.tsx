import { Dialog, Transition } from '@headlessui/react';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { IconUpload } from '@tabler/icons-react';
import React, { Fragment, useRef } from 'react';

import { useFileUpload } from '@/hooks/file/useFileUpload';

import { FileListGridView } from '@/components/FileListGridView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { UploadProgress } from './UploadProgress';

type Props = {
  onClose: () => void;
};

export default function FilePortalModel({ onClose }: Props) {
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
                <div className="p-6 bg-neutral-900 flex-grow relative overflow-y-auto">
                  <button
                    className="w-max min-h-[34px] p-4 absolute top-0 right-0"
                    onClick={onClose}
                  >
                    <IconX />
                  </button>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-neutral-200 font-bold">
                        File Portal
                      </div>
                      <div className="p-4">
                        <UploadFileComponent />
                      </div>
                      <div className="p-4">
                        <Card className="w-full bg-yellow-100 text-black ">
                          <CardHeader className="flex flex-row justify-center items-center gap-3 px-4 py-3">
                            <IconAlertCircle className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-base font-medium !mt-0">
                              Warning
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm px-4 py-2">
                            <p>Currently we only support PDF and TXT files.</p>
                            <ul>
                              <li>File Size Limitation: 50 MB</li>
                              <li>PDF Page Limitation: 300 Pages</li>
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="py-4">
                        <FileListGridView closeDialogCallback={onClose} />
                      </div>
                    </div>
                  </div>
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
  const uploadFileMutation = useFileUpload();
  const {
    uploadFileMutation: { mutateAsync: uploadFile },
    uploadProgress,
  } = uploadFileMutation;
  const fileInputRef = useRef<HTMLInputElement>(null); // Added a ref to the input

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      console.error('No file selected.');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const uploadOk = await uploadFile({ filename: file.name, file });

    if (uploadOk) {
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      console.error('Upload failed');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex gap-4">
        <Button
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 bg-neutral-50 text-neutral-900 hover:bg-neutral-50/90 focus:ring-neutral-300"
          onClick={triggerFileInput}
        >
          <IconUpload className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <div className="flex-1">
          {uploadProgress && <UploadProgress progressNumber={uploadProgress} />}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf, text/plain"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
