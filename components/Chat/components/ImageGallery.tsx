import React, { useState } from 'react';

import { getMjImageTags } from '@/utils/app/mjImage';

import { MemoizedReactMarkdown } from '@/components/Markdown/MemoizedReactMarkdown';

import Carousel from './Carousel';
import MjImageComponent from './MjImageComponent';

import rehypeMathjax from 'rehype-mathjax';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface ImageGalleryProps {
  message: string;
}

export default function ImageGallery({ message }: ImageGalleryProps) {
  const aiImageList = getMjImageTags(message);
  return (
    <Carousel>
      {aiImageList.map((aiImageHtml, index) => {
        return (
          <MemoizedReactMarkdown
            key={`aiImageHtml-${index}`}
            className="min-w-full"
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeMathjax, rehypeRaw]}
            components={{
              img: ImgComponent,
            }}
          >
            {aiImageHtml}
          </MemoizedReactMarkdown>
        );
      })}
    </Carousel>
  );
}

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
