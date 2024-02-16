import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, {
  Dispatch,
  SetStateAction,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQuery } from 'react-query';

import { useTranslation } from 'next-i18next';

import { Pagination as PaginationType } from '@/types/pagination';
import {
  ShareMessagesByTeacherProfilePayload,
  StudentMessageSubmission,
} from '@/types/share-messages-by-teacher-profile';

import HomeContext from '@/components/home/home.context';

import Spinner from '../Spinner/Spinner';
import Pagination from './Pagination';
import SharedMessageItem from './SharedMessageItem';

const SharedMessages = memo(() => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);
  const [pagination, setPagination] = useState<PaginationType>({
    current_page: 1,
    total_pages: 0,
    next_page: 0,
    prev_page: 0,
  });

  const [sharedMessages, setSharedMessages] = useState<
    ShareMessagesByTeacherProfilePayload['submissions'] | null
  >(null);

  const { refetch: fetchSharedMessages, isFetching: isLoading } =
    useFetchSharedMessages(
      pagination.current_page,
      setSharedMessages,
      setPagination,
    );

  useEffect(() => {
    if (user) {
      fetchSharedMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Shared Messages')}</h1>
      {isLoading && !sharedMessages && (
        <div className="flex mt-[50%]">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!isLoading && (!sharedMessages || !sharedMessages?.length) && (
        <div>No Submissions</div>
      )}
      <div className="flex flex-wrap gap-4">
        {sharedMessages?.map((submission) => (
          <SharedMessageItem
            className=""
            key={submission.id}
            submission={submission}
          />
        ))}
      </div>

      {sharedMessages && sharedMessages.length > 0 && (
        <div className="my-4">
          <Pagination
            pagination={pagination}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
});

SharedMessages.displayName = 'SharedMessages';

export default SharedMessages;

export const useFetchSharedMessages = (
  page: number = 1,
  setSharedMessages: Dispatch<
    SetStateAction<ShareMessagesByTeacherProfilePayload['submissions'] | null>
  >,
  setPagination: Dispatch<SetStateAction<PaginationType>>,
) => {
  const supabase = useSupabaseClient();
  return useQuery(
    ['studentSharedMessages', page],
    async () => {
      const payload = {
        accessToken: (await supabase.auth.getSession()).data.session
          ?.access_token,
        page,
      };
      const response = await fetch('/api/get-shared-messages-with-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.status !== 200 || !response.ok) {
        throw new Error('Failed to fetch shared messages');
      }
      const data = await response.json();
      return data;
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000, // 3 seconds
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        setSharedMessages(data.submissions || null);
        setPagination({
          current_page: data.pagination.current_page,
          total_pages: data.pagination.total_pages,
          next_page: data.pagination.next_page,
          prev_page: data.pagination.prev_page,
        });
      },
      onError: (error) => {
        console.error(
          'There has been a problem with your fetch operation:',
          error,
        );
      },
    },
  );
};
