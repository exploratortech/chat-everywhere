import dayjs from "dayjs";

import { AttachmentCollection } from "@/types/attachment";

const list = (): string[] => {
  const data = localStorage.getItem('attachments');
  if (!data) return [];

  let attachments!: AttachmentCollection;
  try {
    attachments = JSON.parse(data) as AttachmentCollection;
  } catch (error) {
    throw new Error('Unable to retrieve files');
  }

  const filenames = Object.keys(attachments);
  return filenames.sort((a, b) => a.toUpperCase() < b.toUpperCase() ? -1 : 1);
};

const openUploadWindow = async (): Promise<FileList> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type='file';
    input.accept = 'text/plain';
    input.multiple = true;
    input.onchange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) {
        resolve(new FileList());
      } else {
        resolve(files);
      }
    };
    input.click();
  })
};

const read = (attachmentName: string): string => {
  const data = localStorage.getItem('attachments');
  if (!data) throw new Error('Couldn\'t find file');
  
  let attachments!: AttachmentCollection;
  try {
    attachments = JSON.parse(data);
  } catch (error) {
    throw new Error('Unable to retrieve file');
  }

  const attachment = attachments[attachmentName];
  if (!attachment) throw new Error('Couldn\'t find file');

  return attachment.content;
};

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

const upload = async (files: FileList | File[]): Promise<AttachmentCollection> => {
  const uploadedAttachments = await createAttachment(files);
  
  const data = localStorage.getItem('attachments');
  let updatedAttachments: AttachmentCollection = {};

  if (data) {
    const existingAttachments = JSON.parse(data) as AttachmentCollection;
    updatedAttachments = {
      ...existingAttachments,
      ...uploadedAttachments,
    };
  } else {
    updatedAttachments = {
      ...uploadedAttachments,
    };
  }

  const jsonString = JSON.stringify(updatedAttachments);
  localStorage.setItem('attachments', jsonString);

  return updatedAttachments;
};

const write = (attachmentName: string, content: string): string => {
  const data = localStorage.getItem('attachments') || '{}';

  let existingAttachments!: AttachmentCollection;
  try {
    existingAttachments = JSON.parse(data) as AttachmentCollection;
  } catch (error) {
    existingAttachments = {};
  }
  
  const blob = new Blob([content]);
  const now = dayjs().toISOString();

  const updatedAttachments: AttachmentCollection = {
    ...existingAttachments,
    [attachmentName]: {
      name: attachmentName,
      content,
      size: blob.size,
      type: blob.type,
      createdAt: existingAttachments[attachmentName]
        ? existingAttachments[attachmentName].createdAt
        : now,
      updatedAt: now,
    },
  };

  const jsonString = JSON.stringify(updatedAttachments);
  localStorage.setItem('attachments', jsonString);

  return content;
};

const createAttachment = async (files: FileList | File[]): Promise<AttachmentCollection> => {
  return new Promise<AttachmentCollection>((resolve) => {
    const attachments: AttachmentCollection = {};
    let filesToRead: number = files?.length || 0;

    if (filesToRead === 0) {
      resolve({});
    }

    for (let i = 0; i < files.length; i++) {
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
        if (filesToRead <= 0) resolve(attachments);
      };

      reader.readAsText(file);
    }
  });
};

export const Attachments = {
  list,
  openUploadWindow,
  read,
  remove,
  rename,
  upload,
  write,
};
