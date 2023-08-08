import { IconCaretLeft, IconCaretRight } from '@tabler/icons-react';
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
    <div className="flex flex-col items-center w-full max-w-[80dvw] mobile:max-w-[70dvw] gap-2">
      <div className="relative flex justify-between w-full">
        {children[currentIndex]}
        <button
          onClick={prevSlide}
          className="absolute left-[-4rem] mobile:left-[-3rem] top-[50%] translate-y-[-50%] p-4 cursor-pointer text-white"
        >
          <IconCaretLeft height={`20dvw`} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-[-4rem] mobile:right-[-3rem] top-[50%] translate-y-[-50%] p-4 cursor-pointer text-white"
        >
          <IconCaretRight height={`20dvw`} />
        </button>
      </div>

      <div className="flex justify-center space-x-2 my-2">
        {children.map((_, index) => (
          <span
            key={index}
            className={`h-[1dvw] w-[1dvw] rounded-full ${
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
            className="relative w-16 h-16 cursor-pointer"
          >
            {React.cloneElement(child as React.ReactElement<any>, {
              className: 'child-no-margin child-no-click',
            })}
            <div
              className={`w-full h-full absolute top-0 left-0 ${
                currentIndex === index ? 'bg-transparent' : 'bg-black/70 '
              }`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
