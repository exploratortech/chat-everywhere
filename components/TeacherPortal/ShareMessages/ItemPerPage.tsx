import React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import useTeacherSettings from '@/hooks/teacherPortal/useTeacherSettings';

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
  const { updateSettingsMutation } = useTeacherSettings();
  const { mutate: updateSettings } = updateSettingsMutation;
  const { fetchSettingsQuery } = useTeacherSettings();
  const { data: settings } = fetchSettingsQuery;

  const { t } = useTranslation('model');
  // When the item per page value changes, update the teacher settings
  const handleValueChange = (value: string) => {
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      setItemPerPage(value);
      updateSettings({ items_per_page: numericValue });
    }
  };
  useEffect(() => {
    if (settings?.items_per_page) {
      setItemPerPage(settings.items_per_page.toString());
    }
  }, [settings, setItemPerPage]);

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{t('Show')}</span>
      <Select
        onValueChange={(value) => {
          handleValueChange(value);
        }}
        value={itemPerPage}
      >
        <SelectTrigger className="max-h-[30px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-neutral-800">
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
