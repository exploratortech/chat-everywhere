import { IconPlus } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const NewTagButton = ({
  onAddTag,
}: {
  onAddTag: (tag_name: string) => void;
}) => {
  const { t } = useTranslation('model');
  const [tagName, setTagName] = useState('');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={'ghost'}
          size={'default'}
          className=" text-neutral-500"
        >
          <div className="flex items-center gap-1">
            <IconPlus size={18} />
            {t('Add new tag')}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md text-white">
        <DialogHeader>
          <DialogTitle>{t('New Tag')}</DialogTitle>
          <DialogDescription>{t('Enter tag name below')}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              id="link"
              defaultValue=""
              placeholder={t('Enter tag name') as string}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onAddTag(tagName)}
            >
              {t('Create')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTagButton;
