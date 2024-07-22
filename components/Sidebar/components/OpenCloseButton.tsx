import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface Props {
  onClick: any;
  side: 'left' | 'right';
}

export const CloseSidebarButton = ({ onClick, side }: Props) => {
  const [showButtonAnimation, setShowButtonAnimation] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShowButtonAnimation(true);
    }, 200);
  }, []);
  return (
    <>
      <button
        className={`fixed top-5 
        ${side === 'right' && showButtonAnimation ? 'right-[270px]' : ''}
        ${side === 'left' && showButtonAnimation ? 'left-[270px]' : ''}
        ${side === 'right' && !showButtonAnimation ? 'right-0' : ''}
        ${side === 'left' && !showButtonAnimation ? 'left-0' : ''}
         z-50 size-7 transition-all ease-linear hover:text-gray-400 dark:text-white dark:hover:text-gray-300  sm:top-0.5 sm:size-8
          sm:text-neutral-700`}
        onClick={onClick}
      >
        {side === 'right' ? <IconArrowBarRight /> : <IconArrowBarLeft />}
      </button>
      <div
        onClick={onClick}
        className="absolute left-0 top-0 z-10 size-full bg-black opacity-70 sm:hidden"
      ></div>
    </>
  );
};

export const OpenSidebarButton = ({ onClick, side }: Props) => {
  return (
    <button
      className={`fixed top-2.5 ${side === 'right' ? 'right-2' : 'left-2'} size-7 text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:z-50${side === 'right' ? 'right-2' : 'left-2'} sm:size-8 sm:text-neutral-700`}
      onClick={onClick}
    >
      {side === 'right' ? <IconArrowBarLeft /> : <IconArrowBarRight />}
    </button>
  );
};
