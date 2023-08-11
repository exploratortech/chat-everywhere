import { IconFile } from '@tabler/icons-react';
import { FC, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';
import { SidebarButton } from '@/components/Sidebar/SidebarButton';

interface Props {}

export const PromptbarSettings: FC<Props> = () => {
  const {
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const { t } = useTranslation('sidebar');
  
  return (
    <div>
      <SidebarButton
        text={t('Files')}
        icon={<IconFile size={18} />}
        onClick={() => {
          homeDispatch({
            field: 'showFilesModal',
            value: true,
          });
        }}
      />
    </div>
  );
};
