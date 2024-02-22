import { IconTrash } from '@tabler/icons-react';
import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '@/components/Sidebar/SidebarButton';
import HomeContext from '@/components/home/home.context';

export const ClearConversations: FC = () => {
  const { dispatch } = useContext(HomeContext);

  const { t } = useTranslation('sidebar');

  return (
    <SidebarButton
      text={t('Clear conversations')}
      icon={<IconTrash size={18} />}
      onClick={() => dispatch({ field: 'showClearConversationsModal', value: true })}
    />
  );
};
