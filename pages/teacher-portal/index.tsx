import { useEffect } from 'react';

import { useRouter } from 'next/router';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

const TeacherPortalIndex = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/teacher-portal/one-time-code');
  }, [router]);

  return null;
};

export default TeacherPortalIndex;

export const getServerSideProps = withCommonServerSideProps();
