import React from 'react';
import { useTranslation } from 'react-i18next';

import { getLastChunkOfText } from '@/utils/app/ui';

import { Button } from '@/components/ui/button';

const ContinueChat = ({
  originalMessage,
  onContinue,
}: {
  originalMessage: string;
  onContinue: (lastWords: string) => void;
}) => {
  const { t } = useTranslation('common');
  return (
    <div className="flex justify-center">
      <Button
        variant={'outline'}
        onClick={() => {
          onContinue(getLastChunkOfText(originalMessage));
        }}
      >
        {t('Continue')}
      </Button>
    </div>
  );
};

export default ContinueChat;
