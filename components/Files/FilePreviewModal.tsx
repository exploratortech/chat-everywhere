import { UserFile } from '@/types/UserFile';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import AudioPreview from './AudioPreview';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import VideoPreview from './VideoPreview';

interface FilePreviewModalProps {
  file: UserFile;
  children: React.ReactNode;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  children,
}) => {
  const renderPreview = () => {
    if (file.filetype.startsWith('application/pdf')) {
      return <PDFPreview objectPath={file.objectPath} />;
    } else if (file.filetype.startsWith('video/')) {
      return <VideoPreview objectPath={file.objectPath} />;
    } else if (file.filetype.startsWith('audio/')) {
      return <AudioPreview objectPath={file.objectPath} />;
    } else if (file.filetype.startsWith('image/')) {
      return <ImagePreview objectPath={file.objectPath} />;
    } else {
      return <p>Preview not available for this file type.</p>;
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="w-full h-full">{children}</DialogTrigger>
      <DialogContent className="min-w-max min-h-max">
        <DialogHeader>
          <DialogTitle>{file.filename}</DialogTitle>
          <DialogDescription>{renderPreview()}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
