import React, { useContext } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { UploadedFiles } from "@/utils/app/uploadedFiles";
import HomeContext from "@/pages/api/home/home.context";

const UploadFilesButton = () => {
  const {
    state: { user },
  } = useContext(HomeContext);

  const { t } = useTranslation('chat');

  const handleClick = async (): Promise<void> => {
    const files = await UploadedFiles.openUploadWindow();
    try {
      const { errors } = await UploadedFiles.upload(files, user?.token);

      if (errors.length) {
        for (const error of errors) {
          toast.error(error.message);
        }
      } else {
        toast.success(t('Files uploaded successfully'));
      }
    } catch (error) {
      if (error instanceof Error)  {
        toast.error(error.message);
      } else {
        toast.error(t('Unable to upload files'));
      }
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

export default UploadFilesButton;
