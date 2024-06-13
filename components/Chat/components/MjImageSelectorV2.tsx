/* eslint-disable @next/next/no-img-element */
import React from 'react';

export interface MjImageItem {
  imageUrl: string;
  imageAlt: string;
  buttons: string[];
}
export interface MjImageSelectorV2Props {
  imageUrl: string;
  buttons: string[];
  buttonMessageId: string;
  prompt: string;
}

// THE COMPONENT IS USED FOR STATIC HTML GENERATION, SO DON'T USE HOOKS OR STATE
export default function MjImageSelectorV2({
  imageUrl,
  buttons,
  buttonMessageId,
  prompt,
}: MjImageSelectorV2Props) {
  return (
    <div id="mj-image-static-v2" className="my-4">
      {/* // DO NOT EDIT THE <IMG> TAG BELOW. IT WILL BE SWAPPED OUT BY THE ReactMarkdown COMPONENT. */}
      <img
        key={`mj-image-${imageUrl}`}
        src={imageUrl}
        alt={imageUrl}
        data-ai-image-buttons={buttons.join(',')}
        data-ai-image-button-message-id={buttonMessageId}
        data-ai-image-prompt={prompt}
      />
    </div>
  );
}
