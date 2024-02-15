import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import useUserProfile from '@/hooks/useUserProfile';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import SharedMessages from '@/components/TeacherPortal/SharedMessages';
import Sidebar from '@/components/TeacherPortal/Sidebar';
import { TeacherPortalContext } from '@/components/TeacherPortal/teacher-portal.context';
import { portalState } from '@/components/TeacherPortal/teacher-portal.state';
import OneTimeCodeGeneration from '@/components/User/OneTimeCodeGeneration';
import HomeContext from '@/components/home/home.context';
import DefaultLayout from '@/components/layout/default';

const TeacherPortal = () => {
  const PortalState = useCreateReducer({
    initialState: portalState,
  });
  const {
    state: { showing },
  } = PortalState;

  // State to track if the component has mounted (i.e., we're on the client side)
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Set hasMounted to true when the component mounts
    setHasMounted(true);
  }, []);

  return (
    <DefaultLayout>
      <TeacherPortalContext.Provider value={{ ...PortalState }}>
        <RedirectToHomePage />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center mobile:block">
            <div className="w-full tablet:max-w-[90vw] transform overflow-hidden text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex h-[100dvh] tablet:max-h-[unset] !max-w-[unset] !rounded-none">
              {hasMounted && (
                <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />
              )}
              <div className="p-6 bg-neutral-900 flex-grow relative overflow-y-auto">
                {showing === 'one-time-code' && <OneTimeCodeGeneration />}
                {showing === 'shared-message' && <SharedMessages />}
              </div>
            </div>
          </div>
        </div>
      </TeacherPortalContext.Provider>
    </DefaultLayout>
  );
};

export default TeacherPortal;

function RedirectToHomePage() {
  const { data: userProfile, status, isFetched } = useUserProfile({});
  const router = useRouter();

  useEffect(() => {
    if (status === 'success' && isFetched) {
      if (!userProfile?.isTeacherAccount) {
        router.replace('/');
      }
    }
    if (status === 'error') {
      router.replace('/');
    }
  }, [status, isFetched, userProfile, router]);

  return null;
}

export const getServerSideProps = withCommonServerSideProps();
