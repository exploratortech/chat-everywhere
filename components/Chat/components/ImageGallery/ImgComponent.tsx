import React from 'react';

import MjImageComponent from '../MjImageComponent';

const ImgComponent = ({
  src,
  node,
}: React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement> & { node?: any },
  HTMLImageElement
>) => {
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  if (!src) return <></>;
  if (!isValidUrl(src)) return <b>{`{InValid IMAGE URL}`}</b>;

  const aiImageButtons =
    node?.properties?.dataAiImageButtons &&
    (node?.properties?.dataAiImageButtons).split(',');
  const aiImagePrompt =
    node?.properties?.dataAiImagePrompt &&
    (node?.properties?.dataAiImagePrompt).split(',');
  const aiImageButtonMessageId = node?.properties?.dataAiImageButtonMessageId;
  if (aiImageButtons) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <MjImageComponent
        src={src}
        buttons={aiImageButtons}
        buttonMessageId={aiImageButtonMessageId}
        prompt={aiImagePrompt}
      />
    );
  } else {
    return <></>;
  }
};

export default ImgComponent;
