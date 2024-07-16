import React, { useCallback, useEffect, useState } from 'react';
import { NotionRenderer } from 'react-notion-x';

import Spinner from '../Spinner/Spinner';

import type { ExtendedRecordMap } from 'notion-types';

interface Props {
  pageId: string;
}

function NewsPage({ pageId }: Props) {
  const [recordMap, setRecordMap] = useState<ExtendedRecordMap>();

  const fetchPageData = useCallback(async () => {
    const response = await fetch(`/api/notion/${pageId}`);
    const { recordMap } = await response.json();
    setRecordMap(recordMap);
  }, [pageId]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  if (recordMap) {
    return (
      <NotionRenderer
        className="m-2 !w-full overflow-y-scroll"
        recordMap={recordMap}
        fullPage={false}
        header={true}
        darkMode={true}
        components={{
          Collection: () => {
            return <></>;
          },
          PageLink: ({ ...props }) => {
            return (
              <a
                target="_blank"
                {...props}
                href={`https://explorator.notion.site/${props.href}`}
              />
            );
          },
        }}
      />
    );
  }
  return <Spinner size="16px" className="mx-auto mt-[50%]" />;
}

export default NewsPage;
