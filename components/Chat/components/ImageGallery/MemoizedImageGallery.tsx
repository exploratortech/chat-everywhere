import { memo } from 'react';

import ImageGallery from './ImageGallery';

const MemoizedImageGallery = memo(ImageGallery, (prevProps, nextProps) => {
  return prevProps.aiImageList.length === nextProps.aiImageList.length;
});
export default MemoizedImageGallery;
