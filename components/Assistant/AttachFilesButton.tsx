import React, { useRef } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { AttachmentCollection } from "@/types/attachment";
import dayjs from "dayjs";

const AttachFilesButton = () => {
  const { t } = useTranslation('chat');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (!files) return;

    try {
      createAttachments(files, (newAttachments: AttachmentCollection) => {
        const data = localStorage.getItem('attachments');
        let updatedData = '{}';

        if (data) {
          const existingAttachments = JSON.parse(data) as AttachmentCollection;
          const updatedAttachments: AttachmentCollection = {
            ...existingAttachments,
            ...newAttachments,
          };
          updatedData = JSON.stringify(updatedAttachments);
        } else {
          updatedData = JSON.stringify(newAttachments);
        }

        localStorage.setItem('attachments', updatedData);
        toast.success(t('Files uploaded successfully'));
      });
    } catch (error) {
      toast.error(t('Unable to upload files'));
    }
  };

  const createAttachments = (files: FileList, onDone: (attachments: AttachmentCollection) => void) => {
    const attachments: AttachmentCollection = {};
    let filesToRead = files?.length;

    for (let i = 0; i < files?.length; i++) {
      const reader = new FileReader();
      const file = files[i];

      reader.onload = () => {
        if (reader.result != null) {
          const now = dayjs().toISOString();

          attachments[file.name] = {
            name: file.name,
            content: reader.result as string,
            size: file.size,
            type: file.type,
            createdAt: now,
            updatedAt: now,
          };
        }

        filesToRead -= 1;
        if (filesToRead <= 0) onDone(attachments);
      };

      reader.readAsText(file);
    }
  };

  return (
    <div>
      <button
        className="p-1 text-zinc-500 bg-white dark:text-zinc-400 dark:bg-[#40414F] rounded-sm"
        onClick={handleClick}
      >
        <IconPaperclip size={18}/>
      </button>
      <input
        accept="text/csv,text/plain"
        className="hidden"
        multiple
        onChange={handleChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
};

export default AttachFilesButton;
