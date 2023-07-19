import React from 'react';

export interface MjImageItem {
  imageUrl: string;
  imageAlt: string;
  buttons: string[];
}
export interface MjImageSelectorProps {
  previousButtonCommand: string;
  imageList: MjImageItem[];
  buttonMessageId: string;
}
export default function MjImageSelector({
  previousButtonCommand,
  imageList,
  buttonMessageId,
}: MjImageSelectorProps) {
  const upscalePattern = /^U\d$/i;
  const isPreviousUpscaleCommand = upscalePattern.test(previousButtonCommand);

  if (isPreviousUpscaleCommand) {
    return (
      <div id="mj-image-upscaled" className="my-4">
        {imageList.map((image, index) => (
          // DO NOT EDIT THE <IMG> TAG BELOW. IT WILL BE SWAPPED OUT BY THE ReactMarkdown COMPONENT.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`mj-image-${image.imageUrl}-${index}`}
            src={image.imageUrl}
            alt={image.imageAlt}
            data-ai-image-buttons={image.buttons.join(',')}
            data-ai-image-button-message-id={buttonMessageId}
          />
        ))}
      </div>
    );
  } else {
    return (
      <div id="mj-image-selection" className="grid grid-cols-2 gap-0 my-4">
        {imageList.map((image, index) => (
          // DO NOT EDIT THE <IMG> TAG BELOW. IT WILL BE SWAPPED OUT BY THE ReactMarkdown COMPONENT.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`mj-image-${image.imageUrl}-${index}`}
            src={image.imageUrl}
            alt={image.imageAlt}
            data-ai-image-buttons={image.buttons.join(',')}
            data-ai-image-button-message-id={buttonMessageId}
          />
        ))}
      </div>
    );
  }
}
