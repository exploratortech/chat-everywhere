import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: '/teacher-portal/one-time-code', // Target route
      permanent: false, // Temporary redirect, set to true if it's a permanent redirect
    },
  };
};

const TeacherPortalIndex = () => {
  // This component will not actually render because of the server-side redirect,
  // but you can return a simple component or loading state if needed.
  return null;
};

export default TeacherPortalIndex;
