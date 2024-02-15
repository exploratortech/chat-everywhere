import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import DefaultLayout from '@/components/layout/default';

import Home from './api/home/home';

export default function Index() {
  return (
    <DefaultLayout>
      <Home />
    </DefaultLayout>
  );
}

export const getServerSideProps = withCommonServerSideProps();
