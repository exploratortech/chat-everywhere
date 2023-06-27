import { IconArrowBigRightLines } from '@tabler/icons-react';
import React from 'react';

export const ContinueGenerationButton: React.FC = () => {
  return (
    <button
      className={`cursor-pointer text-gray-500 hover:text-gray-300 ml-2`}
      onClick={() => {}}
    >
      <IconArrowBigRightLines size={18} fill={'none'} />
    </button>
  );
};
