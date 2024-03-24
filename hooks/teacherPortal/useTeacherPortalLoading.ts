import { useContext, useEffect } from 'react';

import { TeacherPortalContext } from '@/components/TeacherPortal/teacher-portal.context';

const useTeacherPortalLoading = (isLoading?: boolean) => {
  const { startLoading, completeLoading } = useContext(TeacherPortalContext);
  useEffect(() => {
    if (isLoading === undefined) return;
    if (isLoading) {
      startLoading();
    } else {
      completeLoading();
    }
  }, [completeLoading, isLoading, startLoading]);

  const withLoading = async <T, A extends any[]>(
    asyncFunction: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<T> => {
    startLoading();
    try {
      const result = await asyncFunction(...args);
      return result;
    } catch (error) {
      throw error;
    } finally {
      completeLoading();
    }
  };

  return { startLoading, completeLoading, withLoading };
};

export default useTeacherPortalLoading;
