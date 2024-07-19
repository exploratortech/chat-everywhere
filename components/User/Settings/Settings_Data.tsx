import { IconFileExport } from '@tabler/icons-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  handleExportData,
  handleImportConversations,
} from '@/utils/app/importExport';

import type { SupportedExportFormats } from '@/types/export';

import { Import } from '@/components/Settings/Import';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import HomeContext from '@/components/home/home.context';

export default function Settings_Data() {
  const { t } = useTranslation('model');

  const {
    state: { selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const handleImport = (data: SupportedExportFormats) => {
    handleImportConversations(data, homeDispatch, selectedConversation);
  };

  return (
    <div>
      <h1 className="mb-4 font-bold">{t('Data')}</h1>
      <Import onImport={handleImport} />
      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={handleExportData}
      />
    </div>
  );
}
