import { Dispatch, createContext } from "react";
import { ActionType } from "@/hooks/useCreateReducer";

import { Attachment, AttachmentCollection } from "@/types/attachment";

export interface AttachmentsModelState {
  attachments: AttachmentCollection;
  attachmentNames: string[];
  loading: boolean;
  nextFile: string | null;
}

export interface AttachmentsModelContextProps {
  state: AttachmentsModelState;
  dispatch: Dispatch<ActionType<AttachmentsModelState>>;
  closeModel: () => void;
  // loadAttachments: () => Promise<void>;
  loadFiles: () => Promise<{ files: Attachment[], next: string | null }>;
  deleteAttachment: (attachmentName: string) => Promise<boolean>;
  renameAttachment: (oldName: string, newName: string) => boolean;
  uploadAttachments: (files: FileList | File[]) => Promise<boolean>;
}

const AttachmentsModelContext = createContext<AttachmentsModelContextProps>(undefined!);

export default AttachmentsModelContext;
