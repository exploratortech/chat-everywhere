import dayjs from "dayjs";

import { Attachment, AttachmentCollection } from "@/types/attachment";

// Extracts the file name from a path
const filenameFromPath = (path: string): string | null => {
  const substrings = path.split('/');
  if (substrings.length === 0) return null;
  return substrings[substrings.length - 1];
};

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

const load = async (userToken?: string, page: number = 0): Promise<Attachment[]> => {
  if (userToken) {
    const res = await fetch(`/api/attachments?page=${page}`, {
      headers: { 'user-token': userToken },
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const json = await res.json();
    return json.attachments;
  } else {
    const data = localStorage.getItem('attachments');
    if (!data) return [];

    const attachmentCollection: AttachmentCollection = JSON.parse(data);
    const sortedAttachments = Object.values(attachmentCollection)
      .sort((a, b) => a.name.toUpperCase() < b.name.toUpperCase() ? -1 : 1);
    return sortedAttachments;
  }
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
  });
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

const remove = async (attachmentNames: string[], userToken?: string): Promise<string[]> => {
  if (userToken) {
    const params = encodeURIComponent(attachmentNames.join(','));
    const res = await fetch(`/api/attachments?names=${params}`, {
      headers: { 'user-token': userToken },
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const json = await res.json();
    return json.filenames;
  } else {
    const data = localStorage.getItem('attachments');
    if (!data) return [];
  
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
  
    return attachmentNames;
  }
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

const upload = async (files: FileList | File[], userToken?: string): Promise<[AttachmentCollection, any[]]> => {
  let uploadedAttachments = await createAttachments(files);
  let errors: any[] = [];

  if (userToken) {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append('attachments[]', file, file.name);
    }
  
    const res = await fetch('/api/attachments/', {
      method: 'POST',
      body: formData,
      headers: { 'user-token': userToken },
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const json = await res.json();
    for (const error of json.errors) {
      delete uploadedAttachments[error.filename];
    }
  } else {
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
  }

  return [uploadedAttachments, errors];
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

const createAttachments = async (files: FileList | File[]): Promise<AttachmentCollection> => {
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
  filenameFromPath,
  list,
  load,
  openUploadWindow,
  read,
  remove,
  rename,
  upload,
  write,
};
