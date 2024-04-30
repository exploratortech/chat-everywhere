import { IconFile, IconPdf } from '@tabler/icons-react';

interface FileIconProps {
  fileType: string;
}
const UserFileItemIcon: React.FC<FileIconProps> = ({ fileType }) => {
  switch (fileType) {
    case 'text/plain':
      return <IconFile />;
    case 'application/pdf':
      return <IconPdf />;
    default:
      return <IconFile />;
  }
};

export default UserFileItemIcon;
