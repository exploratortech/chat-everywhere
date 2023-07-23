import { useContext, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import FilesModelContext from "./AttachmentsModel.context";
import { AttachmentItem } from "./AttachmentItem";

export const AttachmentsList = (): JSX.Element => {
  const {
    state: { attachments },
    uploadAttachments,
  } = useContext(FilesModelContext);

  const enterTarget = useRef<HTMLElement | null>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation('models');

  const sortedAttachments = useMemo((): string[] => {
    return Object.keys(attachments).sort(
      (a, b) => a.toUpperCase() < b.toUpperCase() ? -1 : 1
    );
  }, [attachments]);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    enterTarget.current = event.target as HTMLElement;

    if (event.dataTransfer.items) {
      const item = event.dataTransfer.items[0];
      if (!item || item.kind !== 'file') return;
    }

    if (dropAreaRef.current) {
      dropAreaRef.current.style.opacity = '1';
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (enterTarget.current == event.target) {
      if (dropAreaRef.current) {
        dropAreaRef.current.style.opacity = '0';
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();

    let files!: FileList | File[];
    if (event.dataTransfer.items) {
      files = [];
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = event.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    } else {
      files = event.dataTransfer.files;
    }

    if (dropAreaRef.current) {
      dropAreaRef.current.style.opacity = '0';
    }

    await uploadAttachments(files);
  };

  return (
    <>
      <div className="flex flex-row justify-between text-sm text-neutral-400 py-2 pl-10 pr-[120px] tablet:pr-[54px]">
        <p>{t('Name')}</p>
        <div className="flex flex-row gap-2">
          <p className="block mobile:hidden">{t('Updated At')}</p>
          <p className="w-20 text-right">{t('Size')}</p>
        </div>
      </div>
      <div
        className="relative flex flex-col flex-1 overflow-y-auto"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          className="absolute top-0 right-0 bottom-0 left-0 rounded-md border-2 bg-indigo-300/30 border-indigo-400 opacity-0 transition-opacity ease-out duration-200"
          ref={dropAreaRef}
        />
        {sortedAttachments.map((attachmentName) => {
          const attachment = attachments[attachmentName];
          return (
            <AttachmentItem
              attachment={attachment}
              key={attachment.name}
            />
          );
        })}
      </div>
    </>
  );
};
