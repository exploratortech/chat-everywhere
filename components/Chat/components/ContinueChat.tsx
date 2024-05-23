import React from 'react';

import { Button } from '@/components/ui/button';

const ContinueChat = ({
  lastWords,
  onContinue,
}: {
  lastWords: string;
  onContinue: (lastWords: string) => void;
}) => {
  return (
    <Button
      variant={'outline'}
      onClick={() => {
        onContinue(lastWords);
      }}
    >
      Continue
    </Button>
  );
};

export default ContinueChat;
