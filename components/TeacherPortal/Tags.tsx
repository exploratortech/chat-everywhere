import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';

import Spinner from '../Spinner';
import { Button } from '../ui/button';
import Tag from './Tags/Tag';

const Tags = () => {
  const supabase = useSupabaseClient();
  const { t } = useTranslation('model');
  const { data, isLoading, error } = useQuery('tags', async () => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token;
    if (!accessToken) {
      throw new Error('No access token');
    }
    return await fetchTags(accessToken);
  });
  const tags = data?.tags || [];
  return (
    <div className="">
      <h1 className="font-bold mb-4">{t('Tags')}</h1>
      <div className="flex gap-4 flex-wrap min-h-[10rem] content-start">
        {isLoading ? (
          <div className="flex mt-[50%]">
            <Spinner size="16px" className="mx-auto" />
          </div>
        ) : (
          tags.map((tag) => <Tag key={tag.id} label={tag.name} count={2} />)
        )}
      </div>
      <div className="flex items-center">
        <Button
          variant={'ghost'}
          size={'default'}
          className=" text-neutral-500"
        >
          <div className="flex items-center gap-1">
            <IconPlus size={18} />
            {t('Add new tag')}
          </div>
        </Button>
        <Button onClick={() => {}} variant="outline" disabled>
          Remove
        </Button>
      </div>
    </div>
  );
};

export default Tags;

const fetchTags = async (accessToken: string) => {
  const response = await fetch('/api/teacher-portal/teacher-tags', {
    headers: {
      'access-token': accessToken, // Replace 'YOUR_ACCESS_TOKEN_HERE' with the actual access token
    },
  });
  const data = await response.json();
  return data as { tags: { id: number; name: string }[] };
};
