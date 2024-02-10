import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { memo, useContext, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Pagination as PaginationType } from '@/types/pagination';
import {
  ShareMessagesByTeacherProfilePayload,
  StudentMessageSubmission,
} from '@/types/share-messages-by-teacher-profile';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../../Spinner/Spinner';
import Pagination from './Pagination';
import SharedMessageItem from './SharedMessageItem';
import ZoomInSharedMessageItem from './ZoomInSharedMessageItem';

const SharedMessages = memo(() => {
  const { t } = useTranslation('model');
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(true);
  const {
    state: { user },
  } = useContext(HomeContext);
  const [pagination, setPagination] = useState<PaginationType>({
    current_page: 1,
    total_pages: 1,
    next_page: 1,
    prev_page: 1,
  });

  const [sharedMessages, setSharedMessages] = useState<
    ShareMessagesByTeacherProfilePayload['submissions'] | null
  >(null);

  const fetchSharedMessages = async (page = 1) => {
    setIsLoading(true);
    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      page,
    };
    try {
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
      const data =
        (await response.json()) as ShareMessagesByTeacherProfilePayload;
      setSharedMessages(data.submissions || null);
      setPagination({
        current_page: data.pagination.current_page,
        total_pages: data.pagination.total_pages,
        next_page: data.pagination.next_page,
        prev_page: data.pagination.prev_page,
      });
    } catch (error) {
      console.error(
        'There has been a problem with your fetch operation:',
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSharedMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [selectedSubmission, setSelectedSubmission] =
    useState<StudentMessageSubmission | null>(null);

  const handlePageChange = (page: number) => {
    fetchSharedMessages(page);
  };

  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Shared Messages')}</h1>
      {isLoading && (
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
            onSelected={(submission) => setSelectedSubmission(submission)}
            className="cursor-pointer max-w-[300px] max-h-[300px] w-full overflow-hidden"
            key={submission.id}
            submission={submission}
          />
        ))}
      </div>
      <div className="my-4">
        <Pagination
          pagination={pagination}
          handlePageChange={handlePageChange}
        />
      </div>
      <ZoomInSharedMessageItem
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpen={() => {}}
        onClose={() => {
          setSelectedSubmission(null);
        }}
      />
    </div>
  );
});

SharedMessages.displayName = 'SharedMessages';

export default SharedMessages;
