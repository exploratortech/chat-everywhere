import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, {
  Dispatch,
  SetStateAction,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { useTranslation } from 'next-i18next';

import { Pagination as PaginationType } from '@/types/pagination';
import { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';
import { Tag } from '@/types/tags';

import useShareMessageFilterStore from '@/components/TeacherPortal/share-message-filter.store';
import HomeContext from '@/components/home/home.context';

import Spinner from '../Spinner/Spinner';
import { Separator } from '../v2Chat/ui/separator';
import FloatMenu from './FloatMenu';
import Pagination from './Pagination';
import Filter from './ShareMessages/Filter';
import SharedMessageItem from './SharedMessageItem';

const SharedMessages = memo(({ tags }: { tags: Tag[] }) => {
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

  const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);

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

  const handleSelectMessage = (id: number) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((messageId) => messageId !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div>
      <h1 className="font-bold mb-4">{t('Shared messages')}</h1>
      <div className="flex flex-col gap-2 my-4">
        <Filter tags={tags} />
        <Separator />
      </div>
      {isLoading && !sharedMessages && (
        <div className="flex mt-[50%]">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!isLoading && (!sharedMessages || !sharedMessages?.length) && (
        <div>{t('No Submissions found')}</div>
      )}

      <div className="flex flex-wrap gap-4">
        {sharedMessages?.map((submission) => (
          <SharedMessageItem
            key={submission.id}
            submission={submission}
            onSelectMessage={handleSelectMessage}
            isSelected={selectedMessageIds.includes(submission.id)}
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

      <div className="sticky flex justify-center bottom-8 w-full pointer-events-none">
        <FloatMenu
          selectedMessageIds={selectedMessageIds}
          setSelectedMessageIds={setSelectedMessageIds}
        />
      </div>
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
  const queryClient = useQueryClient();
  const { selectedTags } = useShareMessageFilterStore();

  return useQuery(
    [
      'studentSharedMessages',
      page,
      selectedTags.map((tag) => tag.id).join(','),
    ],
    async () => {
      const payload = {
        accessToken: (await supabase.auth.getSession()).data.session
          ?.access_token,
        page,
        filter: {
          tag_ids: selectedTags.map((tag) => tag.id),
        },
      };
      const response = await fetch(
        '/api/teacher-portal/get-shared-messages-with-teacher',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
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
        queryClient.invalidateQueries('teacher-tags');
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
