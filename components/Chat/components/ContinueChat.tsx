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
    <div className="flex justify-center">
      <Button
        variant={'outline'}
        onClick={() => {
          onContinue(lastWords);
        }}
      >
        Continue
      </Button>
    </div>
  );
};

export default ContinueChat;
