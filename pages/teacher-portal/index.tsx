import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import LoadingBar, { LoadingBarRef } from 'react-top-loading-bar';

import useTeacherTags from '@/hooks/useTeacherTags';
import useUrlState from '@/hooks/useUrlState';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import { Tag } from '@/types/tags';

import Spinner from '@/components/Spinner';
import OneTimeCodeGeneration from '@/components/TeacherPortal/OneTimeCodeGeneration';
import SharedMessages from '@/components/TeacherPortal/SharedMessages';
import Sidebar from '@/components/TeacherPortal/Sidebar';
import Tags from '@/components/TeacherPortal/Tags';
import TeacherPrompt from '@/components/TeacherPortal/TeacherPrompt';
import TeacherSettings from '@/components/TeacherPortal/TeacherSettings';
import {
  ShowingChangeAction,
  TeacherPortalContext,
} from '@/components/TeacherPortal/teacher-portal.context';
import { portalState } from '@/components/TeacherPortal/teacher-portal.state';
import DefaultLayout from '@/components/layout/default';

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const TeacherPortal = () => {
  const [showing, setShowing] = useUrlState<typeof portalState.showing>(
    'showing',
    portalState.showing,
  );

  // State to track if the component has mounted (i.e., we're on the client side)
  const [hasMounted, setHasMounted] = useState(false);
  const loadingRef = useRef<LoadingBarRef>(null);
  const startLoading = useCallback(() => {
    loadingRef.current?.continuousStart();
  }, []);
  const completeLoading = useCallback(() => {
    loadingRef.current?.complete();
  }, []);

  const { fetchQuery } = useTeacherTags();
  const { data, isLoading } = fetchQuery;
  const tags: Tag[] = data || [];
  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      completeLoading();
    }
  }, [completeLoading, isLoading, startLoading]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const dispatch: Dispatch<ShowingChangeAction> = (action) => {
    if (action.field === 'showing') {
      setShowing(action.value);
    } else {
      setShowing(portalState.showing);
    }
  };
  return (
    <DefaultLayout>
      <TeacherPortalContext.Provider
        value={{ state: { showing }, dispatch, startLoading, completeLoading }}
      >
        <LoadingBar color={'white'} ref={loadingRef} />;
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center mobile:block">
            <div className="bg-neutral-900 w-full tablet:max-w-[90vw] transform overflow-hidden text-left align-middle shadow-xl transition-all text-neutral-200 flex h-[100dvh] tablet:max-h-[unset] !max-w-[unset] !rounded-none">
              {hasMounted && (
                <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />
              )}
              {isLoading ? (
                <div className="flex-grow relative flex items-center justify-center">
                  <Spinner size="16px" />
                </div>
              ) : (
                <div className="p-6 flex-grow relative overflow-y-auto">
                  {showing === 'one-time-code' && (
                    <OneTimeCodeGeneration tags={tags} />
                  )}
                  {showing === 'shared-message' && (
                    <SharedMessages tags={tags} />
                  )}
                  {showing === 'tags' && <Tags tags={tags} />}
                  {showing === 'teacher-prompt' && <TeacherPrompt />}
                  {showing === 'settings' && <TeacherSettings />}
                </div>
              )}
            </div>
          </div>
        </div>
      </TeacherPortalContext.Provider>
    </DefaultLayout>
  );
};

export default TeacherPortal;

export const getServerSideProps = withCommonServerSideProps(async (context) => {
  const supabase = createServerSupabaseClient(context);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  if (profileError || !profile || !profile.is_teacher_account) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
});
