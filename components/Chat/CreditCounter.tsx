import React, { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { PluginID } from '@/types/plugin';

import HomeContext from '@/components/home/home.context';

type Props = {
  pluginId: PluginID | null;
};

export const CreditCounter: React.FC<Props> = ({ pluginId }) => {
  const { t } = useTranslation('chat');

  const {
    state: { creditUsage, isUltraUser },
    dispatch: homeDispatch,
  } = useContext(HomeContext);


  if (
    creditUsage === null ||
    (pluginId !== PluginID.GPT4 &&
      pluginId !== PluginID.IMAGE_GEN &&
      pluginId !== PluginID.GPT4O && pluginId !== PluginID.aiPainter) ||
    isUltraUser
  )
    return <></>;

  const remainingCredits = ((): number => {
    let result = 0;
    if (pluginId) {
      switch (pluginId) {
        case PluginID.GPT4O:
          result = creditUsage[PluginID.GPT4].remainingCredits;
          break;
        case PluginID.aiPainter:
          result = creditUsage[PluginID.IMAGE_GEN].remainingCredits;
          break;
        default:
          result = creditUsage[pluginId].remainingCredits;
      }
    }
    return result;
  })()

  return (
    <div
      className="flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-300 text-xs ml-3"
      onClick={() => homeDispatch({ field: 'showUsageModel', value: true })}
    >
      {t('Remaining Credits')}: {remainingCredits}
    </div>
  );
};
