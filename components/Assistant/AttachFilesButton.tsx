import React, { useRef } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { Attachments } from "@/utils/app/attachments";

const AttachFilesButton = () => {
  const { t } = useTranslation('chat');

  const handleClick = async (e: any): Promise<void> => {
    const files = await Attachments.openUploadWindow();
    try {
      await Attachments.upload(files);
      toast.success(t('Files uploaded successfully'));
    } catch (error) {
      toast.error(t('Unable to upload files'));
    }
  }

  return (
    <div>
      <button
        className="p-1 text-zinc-500 bg-white dark:text-zinc-400 dark:bg-[#40414F] rounded-sm"
        onClick={handleClick}
      >
        <IconPaperclip size={18}/>
      </button>
    </div>
  );
};

export default AttachFilesButton;
