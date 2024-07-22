import type { FC } from 'react';

import { useTranslation } from 'next-i18next';

export const FootNoteMessage: FC<{ displayV2Link?: boolean }> = ({
  displayV2Link,
}) => {
  const { t } = useTranslation('chat');

  return (
    <div className="px-3 pb-3 text-center text-[12px] text-black/50 dark:text-white/50 md:px-0 md:pb-6">
      <div className="leading-5">
        <a
          href="https://intro.chateverywhere.app"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Chat Everywhere
        </a>{' '}
        by{' '}
        <a
          href="https://exploratorlabs.com"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Explorator Labs
        </a>
        .
        <br />
        {t('Where the forefront of AI technology meets universal access.')}
      </div>
      {displayV2Link && (
        <a href="/v2" target="_blank" rel="noreferrer" className="underline">
          {t('Enter v2 Beta')}
        </a>
      )}
    </div>
  );
};
