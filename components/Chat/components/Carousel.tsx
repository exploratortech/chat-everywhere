import React, { ReactNode, useState } from 'react';

type CarouselProps = {
  children: ReactNode[];
};

const Carousel: React.FC<CarouselProps> = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex >= children.length ? 0 : newIndex);
  };

  const prevSlide = () => {
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex < 0 ? children.length - 1 : newIndex);
  };

  const handleThumbnailClick = (index: number) => (event: React.MouseEvent) => {
    event.stopPropagation();
    setCurrentIndex(index);
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex justify-between w-full">
        <button
          onClick={prevSlide}
          className="p-2 cursor-pointer text-4xl text-white"
        >
          {`<`}
        </button>
        {children[currentIndex]}
        <button
          onClick={nextSlide}
          className="p-2 cursor-pointer text-4xl text-white"
        >
          {`>`}
        </button>
      </div>
      <div className="flex justify-center space-x-2 ">
        {children.map((_, index) => (
          <span
            key={index}
            className={`h-1 w-1 rounded-full ${
              currentIndex === index ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <div className="flex overflow-x-auto  gap-2">
        {children.map((child, index) => (
          <div
            key={index}
            onClick={handleThumbnailClick(index)}
            className="w-16 h-16 cursor-pointer"
          >
            {React.cloneElement(child as React.ReactElement<any>, {
              className: 'child-no-margin child-no-click',
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
