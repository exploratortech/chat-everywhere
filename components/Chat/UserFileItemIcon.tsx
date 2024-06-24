import { IconFile, IconMusic, IconPdf, IconPhoto } from '@tabler/icons-react';

interface FileIconProps {
  fileType: string;
}
const UserFileItemIcon: React.FC<FileIconProps> = ({ fileType }) => {
  switch (fileType) {
    case 'text/plain':
      return <IconFile />;
    case 'application/pdf':
      return <IconPdf />;
    case 'image/png':
    case 'image/jpeg':
      return <IconPhoto />;
    case 'audio/aac':
    case 'audio/flac':
    case 'audio/mp3':
    case 'audio/m4a':
    case 'audio/mpeg':
    case 'audio/mpga':
    case 'audio/mp4':
    case 'audio/opus':
    case 'audio/pcm':
    case 'audio/wav':
    case 'audio/webm':
      return <IconMusic />;
    default:
      return <IconFile />;
  }
};

export default UserFileItemIcon;
