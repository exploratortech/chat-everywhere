import { Attachment, AttachmentCollection } from "@/types/attachment";

export const readFromFile = (filename: string): string => {
  try {
    const data = localStorage.getItem('attachments');
    if (!data) throw new Error();

    const attachments = JSON.parse(data);
    if (!attachments[filename]) throw new Error();

    const attachment: Attachment = attachments[filename];
    return attachment.content;
  } catch (error) {
    return `readFromFile:error`;
  }
};

export const writeToFile = (filename: string, content: string): string => {
  try {
    const data = localStorage.getItem('attachments');
    let updatedAttachments: AttachmentCollection = {};

    if (data) {
      const attachments = JSON.parse(data) as AttachmentCollection;
      updatedAttachments = {
        ...attachments,
        [filename]: {
          name: filename,
          content,
        },
      };
    } else {
      updatedAttachments = {
        [filename]: {
          name: filename,
          content,
        },
      };
    }

    localStorage.setItem('attachments', JSON.stringify(updatedAttachments));
    return content;
  } catch (error) {
    return 'writeToFile:error';
  }
};
