import React from 'react';

import { Card } from '@/components/v2Chat/ui/card';

export const ImageContainer = ({ url }: { url: string }) => {
  console.log('url', url);

  return (
    <div className="max-w-xs mb-5">
      <Card className="p-3">
        <img src={url} alt="Generated Image" />
      </Card>
    </div>
  );
};
