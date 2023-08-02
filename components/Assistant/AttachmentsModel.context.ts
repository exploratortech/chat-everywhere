import { Dispatch, createContext } from "react";
import { ActionType } from "@/hooks/useCreateReducer";

import { AttachmentCollection } from "@/types/attachment";

export interface AttachmentsModelState {
  attachments: AttachmentCollection;
}

export interface AttachmentsModelContextProps {
  state: AttachmentsModelState;
  dispatch: Dispatch<ActionType<AttachmentsModelState>>;
  closeModel: () => void;
  deleteAttachment: (attachmentName: string) => Promise<boolean>;
  renameAttachment: (oldName: string, newName: string) => boolean;
  uploadAttachments: (files: FileList | File[]) => Promise<boolean>;
}

const AttachmentsModelContext = createContext<AttachmentsModelContextProps>(undefined!);

export default AttachmentsModelContext;
