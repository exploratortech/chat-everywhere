import { useContext, useRef } from 'react';

import type { DragDataType } from '@/types/drag';

import HomeContext from '@/components/home/home.context';

interface Props {
  allowedDragTypes?: DragDataType[];
  canDrop?: () => boolean;
  index: number;
  onDrop: (e: React.DragEvent<HTMLElement>, index: number) => void;
}

const DropArea = ({
  allowedDragTypes = [],
  canDrop = () => false,
  index,
  onDrop,
}: Props) => {
  const {
    state: { currentDrag },
  } = useContext(HomeContext);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const isDragTypeAllowed =
    !!currentDrag && allowedDragTypes.includes(currentDrag.type);

  const handleDrop = (e: any) => {
    onDrop(e, index);
    removeHighlight();
  };

  const onDragEnter = () => {
    if (canDrop() && isDragTypeAllowed) {
      if (indicatorRef.current) indicatorRef.current.style.height = '2rem';
    }
  };

  const handleDragLeave = () => {
    removeHighlight();
  };

  const allowDrop = (e: any) => {
    e.preventDefault(); // Ensures drop event occurs
  };

  const removeHighlight = () => {
    if (indicatorRef.current) indicatorRef.current.style.height = '0px';
  };

  return (
    <div
      className="relative h-0 transition-[height] duration-200 ease-out"
      ref={indicatorRef}
    >
      <div className="size-full overflow-hidden">
        <div className="size-full rounded-lg border-2 border-indigo-400" />
      </div>
      <div
        className={`
          absolute inset-x-0 top-0 my-auto h-8 -translate-y-1/2
          ${
            isDragTypeAllowed
              ? 'pointer-events-auto h-12'
              : 'pointer-events-none h-8'
          }
        `}
        onDrop={handleDrop}
        onDragEnter={onDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={allowDrop}
      />
    </div>
  );
};

export default DropArea;
