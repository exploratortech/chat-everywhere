import { AttachmentCollection } from "@/types/attachment";

const remove = (...attachmentNames: string[]): AttachmentCollection => {
  const data = localStorage.getItem('attachments');
  if (!data) return {};

  const attachments: AttachmentCollection = JSON.parse(data);
  const updatedAttachments =  { ...attachments };

  for (const attachmentName of attachmentNames) {
    delete updatedAttachments[attachmentName];
  }

  const jsonString = JSON.stringify(updatedAttachments);
  localStorage.setItem('attachments', jsonString);

  return updatedAttachments;
};

const rename = (oldName: string, newName: string): AttachmentCollection => {
  const data = localStorage.getItem('attachments');
  if (!data) return {};

  const attachments: AttachmentCollection = JSON.parse(data);
  const updatedAttachments = { ...attachments };

  // TODO: Check for conflicting names

  updatedAttachments[newName] = {
    ...attachments[oldName],
    name: newName,
  };
  delete updatedAttachments[oldName];

  const jsonString = JSON.stringify(updatedAttachments);
  localStorage.setItem('attachments', jsonString);

  return updatedAttachments;
};

export const Attachments = {
  remove,
  rename,
};
