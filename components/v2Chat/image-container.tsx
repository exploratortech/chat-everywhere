/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/v2Chat/ui/button';
import { Card } from '@/components/v2Chat/ui/card';
import { Dialog, DialogContent } from '@/components/v2Chat/ui/dialog';
import { IconDownload, IconOpenInNewTab } from '@/components/v2Chat/ui/icons';

import dayjs from 'dayjs';

export const ImageContainer = ({ url }: { url: string }) => {
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const downloadImage = async () => {
    setDownloadLoading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const href = URL.createObjectURL(blob);

      // Create a "hidden" anchor tag with the download attribute and simulate a click.
      const link = document.createElement('a');
      link.href = href;
      link.download = 'chateverywhere-v2-' + dayjs().valueOf() + '.png';
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      toast.error('Unable to download image');
    }
    setDownloadLoading(false);
  };

  const openImageInNewTab = () => {
    window.open(url, '_blank');
  };

  return (
    <>
      <Dialog open={showDialog} onOpenChange={(open) => setShowDialog(open)}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center space-x-2 flex-col p-3">
            <img src={url} alt="Generated Image" />
            <div className="flex flex-row justify-between w-full">
              <Button
                type="submit"
                size="sm"
                className="px-3 mt-3"
                disabled={downloadLoading}
                onClick={downloadImage}
              >
                <span className="sr-only">Download</span>
                <IconDownload className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="sm"
                className="px-3 mt-3"
                disabled={downloadLoading}
                onClick={openImageInNewTab}
              >
                <span className="sr-only">Open in new tab</span>
                <IconOpenInNewTab className="h-4 w-4" />
              </Button>
            </div>
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
