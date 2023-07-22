import { useContext, useMemo } from "react";
import FilesModelContext from "./AttachmentsModel.context";
import { AttachmentItem } from "./AttachmentItem";

export const AttachmentsList = (): JSX.Element => {
  const { state: { attachments } } = useContext(FilesModelContext);

  const sortedAttachments = useMemo(() => {
    return Object.keys(attachments).sort(
      (a, b) => a.toUpperCase() < b.toUpperCase() ? -1 : 1
    );
  }, [attachments]);

  return (
    <div className="overflow-y-auto">
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
  );
};
