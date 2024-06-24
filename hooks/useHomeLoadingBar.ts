import { useContext } from 'react';

import HomeContext from '@/components/home/home.context';

const useHomeLoadingBar = () => {
  const { startLoadingBar, completeLoadingBar } = useContext(HomeContext);
  const withLoading = async <T, A extends any[]>(
    asyncFunction: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<T> => {
    startLoadingBar();
    try {
      const result = await asyncFunction(...args);
      return result;
    } catch (error) {
      throw error;
    } finally {
      completeLoadingBar();
    }
  };

  return { startLoadingBar, completeLoadingBar, withLoading };
};

export default useHomeLoadingBar;
