import { useEffect, useState } from 'react';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import useTeacherTags from '@/hooks/useTeacherTags';

import { withCommonServerSideProps } from '@/utils/withCommonServerSideProps';

import { Tag } from '@/types/tags';

import Spinner from '@/components/Spinner';
import SharedMessages from '@/components/TeacherPortal/SharedMessages';
import Sidebar from '@/components/TeacherPortal/Sidebar';
import Tags from '@/components/TeacherPortal/Tags';
import { TeacherPortalContext } from '@/components/TeacherPortal/teacher-portal.context';
import { portalState } from '@/components/TeacherPortal/teacher-portal.state';
import OneTimeCodeGeneration from '@/components/User/OneTimeCodeGeneration';
import DefaultLayout from '@/components/layout/default';

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const TeacherPortal = () => {
  const PortalState = useCreateReducer({
    initialState: portalState,
  });
  const {
    state: { showing },
  } = PortalState;

  // State to track if the component has mounted (i.e., we're on the client side)
  const [hasMounted, setHasMounted] = useState(false);

  const { fetchQuery } = useTeacherTags();
  const { data, isLoading } = fetchQuery;
  const tags: Tag[] = data || [];

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <DefaultLayout>
      <TeacherPortalContext.Provider value={{ ...PortalState }}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center text-center mobile:block">
            <div className="w-full tablet:max-w-[90vw] transform overflow-hidden text-left align-middle shadow-xl transition-all bg-neutral-800 text-neutral-200 flex h-[100dvh] tablet:max-h-[unset] !max-w-[unset] !rounded-none">
              {hasMounted && (
                <Sidebar className="bg-neutral-800 flex-shrink-0 flex-grow-0" />
              )}
              {isLoading ? (
                <div className="flex mt-[50%]">
                  <Spinner size="16px" className="mx-auto" />
                </div>
              ) : (
                <div className="p-6 bg-neutral-900 flex-grow relative overflow-y-auto">
                  {showing === 'one-time-code' && (
                    <OneTimeCodeGeneration tags={tags} />
                  )}
                  {showing === 'shared-message' && <SharedMessages />}
                  {showing === 'tags' && <Tags tags={tags} />}
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
