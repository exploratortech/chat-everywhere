import { useContext, useRef } from 'react';

import HomeContext from '@/pages/api/home/home.context';
import { DragDataType } from '@/types/drag';

interface Props {
  allowedDragTypes?: DragDataType[];
  canDrop?: () => boolean;
  index: number;
  onDrop: (e: React.DragEvent<HTMLElement>, index: number) => void;
}

const DropArea = ({ allowedDragTypes = [], canDrop = () => false, index, onDrop }: Props) => {
  const {
    state: { currentDrag },
  } = useContext(HomeContext);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const isDragTypeAllowed = !!currentDrag && allowedDragTypes.includes(currentDrag.type);

  const handleDrop = (e: any) => {
    onDrop(e, index);
    removeHighlight(e);
  };

  const onDragEnter = (e: any) => {
    if (canDrop() && isDragTypeAllowed) {
      if (indicatorRef.current)
        indicatorRef.current.style.height = '2rem';
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
      indicatorRef.current.style.height = '0px';
  }

  return (
    <div
      className="relative transition-[height] ease-out duration-200 h-0"
      ref={indicatorRef}
    >
      <div className="w-full h-full overflow-hidden">
        <div className="w-full h-full rounded-lg border-2 border-indigo-400" />
      </div>
      <div
        className={`
          absolute h-8 my-auto top-0 left-0 right-0 -translate-y-1/2
          ${ isDragTypeAllowed ? 'pointer-events-auto h-14' : 'pointer-events-none h-8' }
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
