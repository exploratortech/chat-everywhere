/* eslint-disable react/display-name */
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Dispatch, SetStateAction } from 'react';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import useTeacherPortalLoading from '@/hooks/teacherPortal/useTeacherPortalLoading';
import useTeacherTags from '@/hooks/teacherPortal/useTeacherTags';

import type { Pagination as PaginationType } from '@/types/pagination';
import type { ShareMessagesByTeacherProfilePayload } from '@/types/share-messages-by-teacher-profile';
import type { Tag as TagType } from '@/types/tags';

import useShareMessageFilterStore from '@/components/TeacherPortal/share-message-filter.store';
import HomeContext from '@/components/home/home.context';

import Spinner from '../Spinner/Spinner';
import { Separator } from '../v2Chat/ui/separator';
import FloatMenu from './FloatMenu';
import Pagination from './Pagination';
import SharedMessageList from './ShareMessageList';
import Filter from './ShareMessages/Filter';

import { cn } from '@/lib/utils';

const SharedMessages = () => {
  const { t } = useTranslation('model');
  const {
    state: { user },
  } = useContext(HomeContext);
  const isPeriodicFetchFlag = useRef(false);
  const { fetchQuery } = useTeacherTags(isPeriodicFetchFlag.current);
  const tags: TagType[] = fetchQuery.data || [];
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

  const queryClient = useQueryClient();
  const { refetch: fetchSharedMessages, isFetching: isLoading } =
    useFetchSharedMessages(
      pagination.current_page,
      setSharedMessages,
      setPagination,
      isPeriodicFetchFlag.current,
      () => {
        isPeriodicFetchFlag.current = true;
      },
    );
  // Refresh shared messages and tag filter count after bulk tag edit
  const refetchTags = () => {
    queryClient.invalidateQueries(['shared-messages-with-teacher']);
    queryClient.invalidateQueries(['teacher-tags']);
  };

  useEffect(() => {
    if (user) {
      fetchSharedMessages();
      isPeriodicFetchFlag.current = true;
    }
  }, [fetchSharedMessages, user]);

  const handlePageChange = (newPage: number) => {
    queryClient.cancelQueries(['shared-messages-with-teacher']);
    isPeriodicFetchFlag.current = false;
    setPagination((prev) => ({ ...prev, current_page: newPage }));
  };

  const handleSelectMessage = (id: number, isShiftKey?: boolean) => {
    setSelectedMessageIds((prev) => {
      if (sharedMessages) {
        if (isShiftKey && prev.length > 0) {
          const newSelectedIds = new Set(prev);
          const start = sharedMessages.findIndex(
            (message) => message.id === prev[0],
          );
          const end = sharedMessages.findIndex((message) => message.id === id);
          const [from, to] = start < end ? [start, end] : [end, start];
          sharedMessages
            .slice(from, to + 1)
            .forEach((message) => newSelectedIds.add(message.id));
          return Array.from(newSelectedIds);
        } else if (prev.includes(id)) {
          return prev.filter((messageId) => messageId !== id);
        } else {
          return [...prev, id];
        }
      }
      return prev;
    });
  };

  return (
    <div className="relative flex h-full flex-col gap-1">
      <h1 className="mb-4 font-bold">{t('Shared messages')}</h1>
      <div className="my-4 flex flex-col gap-2">
        <Filter
          tags={tags}
          allSharedMessages={sharedMessages}
          selectedMessageIds={selectedMessageIds}
        />
        <Separator />
      </div>
      {isLoading && !sharedMessages && (
        <div className="mt-[50%] flex">
          <Spinner size="16px" className="mx-auto" />
        </div>
      )}
      {!isLoading && (!sharedMessages || !sharedMessages?.length) && (
        <div>{t('No Submissions found')}</div>
      )}

      <SharedMessageList
        sharedMessages={sharedMessages}
        handleSelectMessage={handleSelectMessage}
        selectedMessageIds={selectedMessageIds}
      />

      {sharedMessages && sharedMessages.length > 0 && (
        <div className="my-4">
          <Pagination
            pagination={pagination}
            handlePageChange={handlePageChange}
          />
        </div>
      )}
      <div
        className={cn(
          'absolute flex justify-center top-0 h-full items-end w-full pointer-events-none',
        )}
      >
        <FloatMenu
          selectedMessageIds={selectedMessageIds}
          setSelectedMessageIds={setSelectedMessageIds}
          submissions={sharedMessages?.filter((message) =>
            selectedMessageIds.includes(message.id),
          )}
          tags={tags}
          refetchTags={refetchTags}
        />
      </div>
    </div>
  );
};

SharedMessages.displayName = 'SharedMessages';

export default SharedMessages;

export const useFetchSharedMessages = (
  page: number = 1,
  setSharedMessages: Dispatch<
    SetStateAction<ShareMessagesByTeacherProfilePayload['submissions'] | null>
  >,
  setPagination: Dispatch<SetStateAction<PaginationType>>,
  isPeriodic: boolean = true,
  onSuccess: () => void,
) => {
  const supabase = useSupabaseClient();
  const { selectedTags, sortBy, itemPerPage } = useShareMessageFilterStore();

  const { withLoading } = useTeacherPortalLoading();
  const previousItemPerPage = useRef(itemPerPage);

  const fetchSharedMessages = async () => {
    // Reset page to 1 if itemPerPage has changed
    if (previousItemPerPage.current !== itemPerPage) {
      page = 1;
      previousItemPerPage.current = itemPerPage;
    }

    const payload = {
      accessToken: (await supabase.auth.getSession()).data.session
        ?.access_token,
      page,
      filter: {
        tag_ids: selectedTags.map((tag) => tag.id),
        sort_by: sortBy,
      },
      itemPerPage,
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
  };
  return useQuery(
    [
      'shared-messages-with-teacher',
      page,
      selectedTags,
      sortBy.sortKey,
      sortBy.sortOrder,
      itemPerPage,
    ],
    () => {
      if (isPeriodic) {
        return fetchSharedMessages();
      }
      return withLoading(fetchSharedMessages);
    },
    {
      keepPreviousData: true,
      refetchInterval: 3000, // 3 seconds
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        onSuccess();
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
