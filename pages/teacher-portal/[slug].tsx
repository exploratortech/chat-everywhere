import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import LoadingBar, { LoadingBarRef } from 'react-top-loading-bar';

import { useRouter } from 'next/router';

import useTeacherTags from '@/hooks/teacherPortal/useTeacherTags';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import { Tag } from '@/types/tags';
import { RouteType } from '@/types/teacher-portal-sub-route';

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

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

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
    state: { isTeacherAccount },
  } = useContext(HomeContext);
  const isLoading = useMemo(
    () => isFetchingTeacherTags || !isTeacherAccount,
    [isFetchingTeacherTags, isTeacherAccount],
  );
  useEffect(() => {
    const timeout = setTimeout(() => {
      // If the user is not a teacher account, redirect them to the home page
      console.log({
        isTeacherAccount,
      });
      if (!isTeacherAccount) {
        window.location.href = '/';
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isTeacherAccount]);

  return (
    <div className="fixed inset-0 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center text-center mobile:block">
        <div className="bg-neutral-900 w-full tablet:max-w-[90vw] transform overflow-hidden text-left align-middle shadow-xl transition-all text-neutral-200 flex h-[100dvh] tablet:max-h-[unset] !max-w-[unset] !rounded-none">
          <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />

          {isLoading ? (
            <div className="flex-grow relative flex items-center justify-center">
              <Spinner size="16px" />
            </div>
          ) : (
            <div className="p-6 flex-grow relative overflow-y-auto">
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

// export const getServerSideProps = withCommonServerSideProps(async (context) => {
//   const supabase = createServerSupabaseClient(context);
//   const {
//     data: { user },
//     error,
//   } = await supabase.auth.getUser();

//   if (error || !user) {
//     return {
//       redirect: {
//         destination: '/',
//         permanent: false,
//       },
//     };
//   }

//   const { data: profile, error: profileError } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', user?.id)
//     .single();

//   if (profileError || !profile || !profile.is_teacher_account) {
//     return {
//       redirect: {
//         destination: '/',
//         permanent: false,
//       },
//     };
//   }

//   return {
//     props: {},
//   };
// });
