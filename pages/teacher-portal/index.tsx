import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: '/teacher-portal/one-time-code',
      permanent: false,
    },
  };
};

const TeacherPortalIndex = () => {
  return null;
};

export default TeacherPortalIndex;
