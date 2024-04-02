import { IconTrash } from '@tabler/icons-react';
import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import HomeContext from '@/components/home/home.context';

export const ClearPrompts: FC = () => {
  const { dispatch } = useContext(HomeContext);

  const { t } = useTranslation('sidebar');

  return (
    <SidebarButton
      text={t('Clear prompts')}
      icon={<IconTrash size={18} />}
      onClick={() => dispatch({ field: 'showClearPromptsModal', value: true })}
    />
  );
};
