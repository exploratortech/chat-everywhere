import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import useShareMessageFilterStore from '../share-message-filter.store';

const ItemPerPage = () => {
  const { itemPerPage, setItemPerPage } = useShareMessageFilterStore();
  const { t } = useTranslation('model');
  return (
    <div className="flex items-center gap-2">
      <span>{t('Show')}</span>
      <Select
        onValueChange={(value) => {
          setItemPerPage(value);
        }}
        defaultValue={itemPerPage}
      >
        <SelectTrigger className="max-h-[30px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 10 }, (_, i) => (i + 1) * 10).map((option) => (
            <SelectItem
              key={option}
              value={option.toString()}
              className="max-h-[30px]"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ItemPerPage;
