import { IconArrowBigRightLines } from '@tabler/icons-react';
import React, { useContext } from 'react';

import HomeContext from '@/pages/api/home/home.context';

type Props = {
  continueGenerateButtonOnClick: () => void;
};
export const ContinueGenerationButton: React.FC<Props> = ({
  continueGenerateButtonOnClick,
}) => {
  const {
    state: {},
  } = useContext(HomeContext);
  return (
    <button
      className={`cursor-pointer text-gray-500 hover:text-gray-300 ml-2`}
      onClick={continueGenerateButtonOnClick}
    >
      <IconArrowBigRightLines size={18} fill={'none'} />
    </button>
  );
};
