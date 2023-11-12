/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

import { Button } from '@/components/v2Chat/ui/button';
import { Card } from '@/components/v2Chat/ui/card';
import { Dialog, DialogContent } from '@/components/v2Chat/ui/dialog';
import { IconDownload } from '@/components/v2Chat/ui/icons';

export const ImageContainer = ({ url }: { url: string }) => {
  const [showDialog, setShowDialog] = useState(false);

  const downloadImage = () => {
    window.open(url, '_blank');
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={(open) => setShowDialog(open)}>
        <DialogContent className="max-w-md">
          <div className="flex items-center space-x-2 flex-col p-3">
            <img src={url} alt="Generated Image" />
            <Button
              type="submit"
              size="sm"
              className="px-3 mt-3"
              onClick={downloadImage}
            >
              <span className="sr-only">Download</span>
              <IconDownload className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="max-w-xs mb-5">
        <Card
          className="p-3 cursor-pointer"
          onClick={() => setShowDialog(true)}
        >
          <img src={url} alt="Generated Image" />
        </Card>
      </div>
    </>
  );
};
