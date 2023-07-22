import { AttachmentCollection } from "@/types/attachment";

const remove = (...attachmentNames: string[]): AttachmentCollection => {
  const data = localStorage.getItem('attachments');
  if (!data) return {};

  let attachments!: AttachmentCollection;
  
  try {
    attachments = JSON.parse(data);
  } catch (error) {
    throw new Error('Unable to remove file');
  }
  
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

  let attachments!: AttachmentCollection;
  
  try {
    attachments = JSON.parse(data);
  } catch (error) {
    throw new Error('Unable to rename file');
  }

  if (newName === oldName) {
    return attachments;
  }

  if (newName.length === 0) {
    throw new Error('Filename cannot be empty');
  }

  if (newName !== oldName && attachments[newName]) {
    throw new Error('Another file with that name already exists');
  }

  const updatedAttachments = { ...attachments };

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
