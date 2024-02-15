import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import Home from '../components/home/home';
import DefaultLayout from '@/components/layout/default';

export default function Index() {
  return (
    <DefaultLayout>
      <Home />
    </DefaultLayout>
  );
}

export const getServerSideProps = withCommonServerSideProps();
