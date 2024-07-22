import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LoadingBarRef } from 'react-top-loading-bar';
import LoadingBar from 'react-top-loading-bar';

import { useRouter } from 'next/router';

import useTeacherTags from '@/hooks/teacherPortal/useTeacherTags';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import type { RouteType } from '@/types/teacher-portal-sub-route';

import Spinner from '@/components/Spinner';
import OneTimeCodeGeneration from '@/components/TeacherPortal/OneTimeCodeGeneration';
import SharedMessages from '@/components/TeacherPortal/SharedMessages';
import Sidebar from '@/components/TeacherPortal/Sidebar';
import Tags from '@/components/TeacherPortal/Tags';
import TeacherPrompt from '@/components/TeacherPortal/TeacherPrompt';
import TeacherSettings from '@/components/TeacherPortal/TeacherSettings';
import { TeacherPortalContext } from '@/components/TeacherPortal/teacher-portal.context';
import HomeContext from '@/components/home/home.context';
import DefaultLayout from '@/components/layout/default';

const validShowings: RouteType[] = [
  'one-time-code',
  'shared-message',
  'tags',
  'teacher-prompt',
  'settings',
];
const TeacherPortal = () => {
  const router = useRouter();
  const { slug } = router.query;

  const showing: RouteType = validShowings.includes(slug as RouteType)
    ? (slug as RouteType)
    : validShowings[0];
  useEffect(() => {
    if (!validShowings.includes(slug as RouteType)) {
      router.push('/teacher-portal/one-time-code');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, router]);

  const loadingRef = useRef<LoadingBarRef>(null);
  const startLoading = useCallback(() => {
    loadingRef.current?.continuousStart();
  }, []);
  const completeLoading = useCallback(() => {
    loadingRef.current?.complete();
  }, []);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return (
    <DefaultLayout>
      {hasMounted && (
        <TeacherPortalContext.Provider
          value={{
            startLoading,
            completeLoading,
          }}
        >
          <LoadingBar color={'white'} ref={loadingRef} />;
          <TeacherPortalContent showing={showing} />
        </TeacherPortalContext.Provider>
      )}
    </DefaultLayout>
  );
};

export default TeacherPortal;

interface TeacherPortalContentProps {
  showing: string;
}

const TeacherPortalContent: React.FC<TeacherPortalContentProps> = ({
  showing,
}) => {
  const { fetchQuery } = useTeacherTags();
  const { isLoading: isFetchingTeacherTags } = fetchQuery;
  const {
    state: { appInitialized, isTeacherAccount },
  } = useContext(HomeContext);
  const isLoading = useMemo(
    () => isFetchingTeacherTags || !isTeacherAccount,
    [isFetchingTeacherTags, isTeacherAccount],
  );
  useEffect(() => {
    if (appInitialized) {
      // Check if user is a teacher account
      // If not, redirect to the home page
      if (!isTeacherAccount) {
        window.location.href = '/';
      }
    }
  }, [appInitialized, isTeacherAccount]);

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center text-center mobile:block">
        <div className="flex h-dvh w-full !max-w-[unset] overflow-hidden !rounded-none bg-neutral-900 text-left align-middle text-neutral-200 shadow-xl transition-all tablet:max-h-[unset] tablet:max-w-[90vw]">
          <Sidebar className="shrink-0 grow-0 bg-neutral-800" />

          {isLoading ? (
            <div className="relative flex grow items-center justify-center">
              <Spinner size="16px" />
            </div>
          ) : (
            <div className="relative grow overflow-y-auto p-6">
              {showing === 'one-time-code' && <OneTimeCodeGeneration />}
              {showing === 'shared-message' && <SharedMessages />}
              {showing === 'tags' && <Tags />}
              {showing === 'teacher-prompt' && <TeacherPrompt />}
              {showing === 'settings' && <TeacherSettings />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withCommonServerSideProps();
