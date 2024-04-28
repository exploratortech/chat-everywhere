import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import React, { Fragment, useContext, useRef, useState } from 'react';

import { useFileUpload } from '@/hooks/useFileUpload';

import HomeContext from '@/components/home/home.context';

import FileList from './FileList';

type Props = {
  onClose: () => void;
};

export default function FilePortalModel({ onClose }: Props) {
  const {
    state: { user, isPaidUser },
  } = useContext(HomeContext);

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
                      <div className="border p-4 rounded-md">
                        <UploadFileComponent />
                      </div>

                      <div className="p-4">
                        <FileList />
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
  const uploadFile = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null); // Added a ref to the input

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      console.error('No file selected.');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    const uploadOk = await uploadFile(file.name, file);

    if (uploadOk) {
      console.log('Upload successful');
      // show success
      if (fileInputRef.current) fileInputRef.current.value = ''; // Clear the input field
    } else {
      console.error('Upload failed');
      // show error
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef} // Attach the ref to the input
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
