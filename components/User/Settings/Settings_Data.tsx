import { IconFileExport } from '@tabler/icons-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import {
  handleExportData,
  handleImportConversations,
} from '@/utils/app/importExport';

import { SupportedExportFormats } from '@/types/export';

import HomeContext from '@/pages/api/home/home.context';

import { Import } from '@/components/Settings/Import';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';

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
      <h1 className="font-bold mb-4">{t("Data")}</h1>
      <Import onImport={handleImport} />
      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={handleExportData}
      />
    </div>
  );
}
