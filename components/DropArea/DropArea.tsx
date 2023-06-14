import { useContext, useRef } from 'react';

import HomeContext from '@/pages/api/home/home.context';

import { DragDataType } from '@/types/drag';

interface Props {
  canDrop?: () => boolean;
  index: number;
  onDrop: (index: number) => void;
}

const DropArea = ({ canDrop = () => false, index, onDrop }: Props) => {
  const {
    state: { currentDrag },
  } = useContext(HomeContext);

  const indicatorRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: any) => {
    onDrop(index);
    removeHighlight(e);
  };

  const onDragEnter = (e: any) => {
    if (canDrop() && currentDrag) {
      if (indicatorRef.current)
        indicatorRef.current.style.background = '#343541';
    }
  };

  const handleDragLeave = (e: any) => {
    removeHighlight(e);
  };

  const allowDrop = (e: any) => {
    e.preventDefault(); // Ensures drop event occurs
  };

  const removeHighlight = (e: any) => {
    if (indicatorRef.current)
      indicatorRef.current.style.background = 'none';
  }

  return (
    <div
      className="relative h-3"
      onDrop={handleDrop}
      onDragEnter={onDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={allowDrop}
    >
      <div
        ref={indicatorRef}
        className="absolute h-6 top-0 bottom-0 left-0 right-0 rounded-lg z-50 pointer-events-none m-0 my-auto"
      />
    </div>
  );
};

export default DropArea;
