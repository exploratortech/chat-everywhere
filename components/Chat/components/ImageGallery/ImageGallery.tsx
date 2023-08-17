import React from 'react';

import { MemoizedReactMarkdown } from '@/components/Markdown/MemoizedReactMarkdown';

import MemoizedCarousel from '../Carousel/MemoizedCarousel';
import ImgComponent from './ImgComponent';

import rehypeMathjax from 'rehype-mathjax';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface ImageGalleryProps {
  aiImageList: string[];
}

export default function ImageGallery({ aiImageList }: ImageGalleryProps) {
  return (
    <MemoizedCarousel>
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
    </MemoizedCarousel>
  );
}
