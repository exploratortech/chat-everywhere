import React, { ReactElement, ReactNode, useMemo } from 'react';

interface CarouselThumbnailsProps {
  children: ReactNode[];
  currentIndex: number;
  handleThumbnailClick: (index: number) => (event: React.MouseEvent) => void;
}

const CarouselThumbnails: React.FC<CarouselThumbnailsProps> = ({
  children,
  currentIndex,
  handleThumbnailClick,
}) => {
  const rearrangedChildren = useMemo(() => {
    // if children length is less or equal then 2, no need to rearrange
    if (children.length <= 2) {
      return children.map((child, index) => ({
        child,
        originalIndex: index,
      }));
    }
    const halfLength = Math.floor(children.length / 2);
    const start = (currentIndex + 1 + halfLength) % children.length;
    const rearranged = [...children.slice(start), ...children.slice(0, start)];
    return rearranged.map((child, index) => ({
      child,
      originalIndex: (start + index) % children.length,
    }));
  }, [children, currentIndex]);

  return (
    <div className="flex overflow-x-auto gap-2">
      {rearrangedChildren.map(({ child, originalIndex }, index) => (
        <div
          key={index}
          onClick={handleThumbnailClick(originalIndex)}
          className="relative w-16 h-16 cursor-pointer"
        >
          {React.cloneElement(child as ReactElement<any>, {
            className: 'child-no-margin child-no-click',
          })}
          <div
            className={`w-full h-full absolute top-0 left-0 ${
              currentIndex === originalIndex ? 'bg-transparent' : 'bg-black/70 '
            }`}
          ></div>
        </div>
      ))}
    </div>
  );
};

export default CarouselThumbnails;
