import React, { useEffect, useState } from 'react';
import { NotionRenderer } from 'react-notion-x';

import Spinner from '../Spinner/Spinner';
import TierTag from './TierTag';

import type { ExtendedRecordMap } from 'notion-types';
import { parsePageId } from 'notion-utils';

interface Props {
  pageId: string;
  internalLinkOnClick: (pageId: string) => void;
}

function FeaturePage({ pageId, internalLinkOnClick }: Props) {
  const [recordMap, setRecordMap] = useState<ExtendedRecordMap>();

  const fetchPageData = async (pageId: string) => {
    setRecordMap(undefined);
    const response = await fetch(`/api/notion/${pageId}`);
    const { recordMap } = await response.json();
    setRecordMap(recordMap);
  };
  const getPageTitle = (recordMap: ExtendedRecordMap) => {
    if (!recordMap) return '';
    const blockId = Object.keys(recordMap.block).find((key) => {
      return parsePageId(key) === parsePageId(pageId);
    });
    if (!blockId) return '';
    return recordMap?.block[blockId]?.value?.properties?.title[0][0] || '';
  };
  const getPropertiesTier = (recordMap: ExtendedRecordMap) => {
    if (!recordMap) return [];
    const blockId = Object.keys(recordMap.block).find((key) => {
      return key.replace(/-/g, '') === pageId.replace(/-/g, '');
    });
    if (!blockId) return [];
    if (!recordMap?.block[blockId]?.value?.properties['{wW:']) return [];

    return recordMap?.block[blockId]?.value?.properties['{wW:'][0][0]
      .split(',')
      .filter((item: string) => item !== '');
  };

  useEffect(() => {
    fetchPageData(pageId);
  }, [pageId]);
  if (recordMap) {
    return (
      <div className="m-2 !w-full overflow-scroll">
        <div className="m-1 text-center text-lg font-bold">
          {getPageTitle(recordMap)}
        </div>
        <div className="my-2 text-center">
          {getPropertiesTier(recordMap).map((tier: string, index: number) => {
            return <TierTag key={index} tier={tier} />;
          })}
        </div>
        <NotionRenderer
          recordMap={recordMap}
          fullPage={false}
          darkMode={true}
          components={{
            Collection: () => {
              return <></>;
            },
            PageLink: ({ ...props }) => {
              return (
                <a
                  {...props}
                  onClick={(e) => {
                    e.preventDefault();
                    const id = props.href;
                    internalLinkOnClick(parsePageId(id));
                  }}
                />
              );
            },
          }}
        />
      </div>
    );
  }
  return <Spinner size="16px" className="mx-auto mt-[50%]" />;
}

export default FeaturePage;
