import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

const ContinueChat = ({
  lastWords,
  onContinue,
}: {
  lastWords: string;
  onContinue: (lastWords: string) => void;
}) => {
  const { t } = useTranslation('common');
  return (
    <div className="flex justify-center">
      <Button
        variant={'outline'}
        onClick={() => {
          onContinue(lastWords);
        }}
      >
        {t('Continue')}
      </Button>
    </div>
  );
};

export default ContinueChat;
