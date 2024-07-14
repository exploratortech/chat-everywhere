import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useDeleteObject } from '@/hooks/file/useDeleteObject';

import { Button } from '../ui/button';

function TrashButton({ objectPath }: { objectPath: string }) {
  const { mutateAsync: deleteFile } = useDeleteObject();
  const { t } = useTranslation('model');
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        deleteFile(objectPath);
      }}
    >
      <IconTrash />
      <span className="sr-only">{t('Delete')}</span>
    </Button>
  );
}

export default TrashButton;
